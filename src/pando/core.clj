(ns pando.core
  (:gen-class)
  (:require
   [compojure.core :as compojure
    :refer [DELETE PUT GET POST context]]
   [compojure.route :as route]
   [ring.middleware.params :as params]
   [ring.middleware.resource :as resource]
   [ring.middleware.file-info :as file-info]
   [ring.middleware.content-type :as content]
   [ring.middleware.json :as json]
   [aleph.http :as http]
   [manifold.stream :as s]
   [manifold.deferred :as d]
   [manifold.bus :as bus] 
   [cheshire.core :as chesh]
   [pando.rooms :as rooms]
   [pando.site :as site]
   [pando.templates :as t]))

;;; SITE
(def site (atom (site/make-site "Pando" (* 4 49.00) [2 5]))) ; tune to G1
(def chatrooms (bus/event-bus))

;;; VALIDATION

(defn is-observer? [user-name]
  (= (clojure.string/lower-case user-name)
     "observer"))

(defn user-name-available? [site room-name user-name]
  (not (contains? (get-in site [:rooms room-name :users]) user-name)))

;;; RESPONSES

(defn html-success-response [body]
  {:status 200
   :headers {"content-type" "text/html"}
   :body body})

(defn json-body [body]
  (chesh/generate-string body))

(def json-non-websocket-response
  {:status 400
   :headers {"content-type" "application/json"}
   :body (json-body {:message "Expected a websocket request."})})

(defn json-success-response [body]
  {:status 200
   :headers {"content-type" "application/json"}
   :body (json-body body)})

(defn json-no-permission-response [body]
  {:status 403
   :headers {"content-type" "application/json"}
   :body (json-body body)})

(defn json-bad-request [body]
  {:status 400
   :headers {"content-type" "application/json"}
   :body (json-body body)})

;;; SITE-LEVEL ROOM AND USER MANIPULATION

(defn remove-user! [room-name user-name]
  (swap! site
         (fn [s]
           (let [new-s (site/modify-room s room-name #(rooms/remove-user % user-name))]
             (if (>= 0 (rooms/user-count (site/get-room new-s room-name)))
               (site/remove-room new-s room-name)
               new-s)))))

(defn add-user! [room-name user-name]  
  (swap! site (fn [s] (site/modify-room s room-name #(rooms/upsert-user % user-name)))))

(defn add-room! [room-name]
  (swap! site #(site/add-room % room-name)))

(defn remove-room! [room-name]
  (swap! site #(site/remove-room % room-name)))

(defn shift-room! [room-name freq]
  (swap! site #(site/modify-room
                % room-name
                (partial rooms/shift-room freq))))

;; I feel like this could be broken out more
(defn pack-room-shift! [user-name room-name message]
  (println message)
  (try
    (let [decoded-message (chesh/decode message)
          room (site/get-room
                (shift-room!
                 room-name
                 (get decoded-message "frequency"))
                room-name)] 
      (chesh/generate-string
       (assoc decoded-message "newRoot" (:root room))))
    (catch Exception e
      (do (println e)
          message))))

(defn connect! [room-name user-name]
  (println "connect!" room-name user-name)
  (fn [conn]
    ;; handler for disconnects
    (s/on-closed
     conn
     #(do (bus/publish! chatrooms room-name
                        (str user-name " has left... :("))
          (remove-user! room-name user-name)))
    
    ;; chatrooms bus -> websocket
    (s/connect (bus/subscribe chatrooms room-name) conn)

    ;; update everyone to new member
    (bus/publish! chatrooms room-name
                  (chesh/generate-string
                   {:userName room-name
                    :message (str user-name " has joined!")}))
    
    ;; websocket -> chatrooms bus (kind of doseq for streams)
    (s/consume
     #(bus/publish! chatrooms room-name (pack-room-shift! user-name room-name %))
     (s/throttle 10 conn))))

;; HELPERS

(defn filter-empty-vals [params]
  (select-keys
   params
   (keep (fn [[k v]]
           (when (not= v "") k))
         params)))

(defn with-room [room-name f]
  (println "room check" room-name @site)
  (if-let [room (get-in @site [:rooms room-name])]    
    (f room)      
    (json-bad-request
     {:message (str room-name " does not exist!")})))

(defn with-websocket-check [exp req]
  (d/let-flow [conn (d/catch (http/websocket-connection req) (fn [_] nil))]
    (if-not conn      
      #'json-non-websocket-response)
      #(exp conn)))

(defn with-room-check [exp room-name]
  (do (when (not (site/room-exists? @site room-name))
        (add-room! room-name))
      exp))

(defn with-user-check [exp room-name user-name]
  (do (when (not (rooms/user-exists? (site/get-room @site room-name) user-name))
        (add-user! room-name user-name))
    exp))

(defn run-checks [exp]  
  (apply @exp []))

;;; HANDLERS

;; Workflow: Client attempts to connect with a given name, if that name
;; is available they go through, if it is not, they are rejected
(defn connect-handler [req room-name user-name]
  (println "connect-handler" room-name user-name)
  (cond
    (not (and room-name user-name))
    (json-bad-request
     {:message "Please provide both a room name a user name"})
    
    (not (user-name-available? @site room-name user-name))
    (json-no-permission-response
     {:message "Your session has expired. Please log in again."})

    (and (not (site/room-exists? @site room-name))
         (is-observer? user-name))
    (json-bad-request
     {:message "You can only observe a room with at least one member."})

    (is-observer? user-name) 
    (run-checks
     (-> #(s/connect (bus/subscribe chatrooms room-name) %)
         (with-websocket-check req)))
    
    :else
    (run-checks
     (-> (connect! room-name user-name)
         (with-websocket-check req)
         (with-room-check room-name)
         (with-user-check room-name user-name)))))

(defn remove-user-handler [req]
  (let [user-name  (get-in req [:body "user-name"])
        room-name  (get-in req [:body "room-name"])]
    (when (and user-name room-name)
      (remove-user! room-name user-name))
    (json-success-response {:message "user removed"})))

;; retemplate this page so that we can embed token data to make
;; repeated log in faster
(defn home-handler [{:keys [params session] :as req}]
  (html-success-response (t/index)))

(defn list-rooms-handler [req]
  (let [rooms (site/list-rooms-info @site)]
    (json-success-response
     {:roomCount (count rooms)
      :rooms rooms})))

(defn list-users-handler [room-name]
  (with-room room-name
    (fn [room]
      (let [usernames (rooms/list-usernames room)]
        (json-success-response
         {:userCount (count usernames)
          :users usernames})))))

(defn get-user-info-handler [room-name user-name]
  (with-room room-name
    (fn [room]
      (let [user (rooms/get-user room user-name)]
        (json-success-response
         {:fundamental (:root room)
          :coord       (:coord user)
          :dimensions  (:dimensions room)})))))

;;; ROUTES

(def room-routes
  (context "/pando/api/rooms" []
           (GET "/list" req (list-rooms-handler req))
           (GET "/info/users/:room-name" [room-name]
                (list-users-handler room-name))
           (GET "/info/:room-name/:user-name" [room-name user-name]
                (get-user-info-handler room-name user-name))))

(def routes
  (compojure/routes   
   room-routes
   (GET "/pando/api/connect/:room-name/:user-name" [room-name user-name :as req]
        (connect-handler req room-name user-name))   
   (DELETE "/pando/api/quit" req (remove-user-handler req))
   (route/files "/pando" {:root "resources/pando"})
   (GET "*" [] home-handler)
   (route/not-found "Not found")))

(def app-routes
  (-> routes
      (content/wrap-content-type)
      (params/wrap-params)
      (json/wrap-json-body)))

(defn start [port]
  (http/start-server #'app-routes {:port port}))

(defn -main [& args]
  (println "listening on port 10002")
  (start 10002))

(comment

  (def s (http/start-server #'app-routes {:port 10001}))
  (.close s)
  
  )
