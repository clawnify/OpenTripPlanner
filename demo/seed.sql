-- Fictional trip plan for an isolated demo. Place names and addresses are invented; coordinates sit around the
-- app's default map centre. Settings are written by the app itself on first request.
INSERT INTO categories (id,name,color,icon,created_at) VALUES
(1,'Food','#EA580C','utensils',datetime('now','-30 days')),
(2,'Activities','#FFFFFF','camera',datetime('now','-30 days')),
(3,'Hotel','#7C3AED','bed-double',datetime('now','-30 days')),
(4,'Shopping','#D97706','shopping-bag',datetime('now','-30 days'));

INSERT INTO pois (id,name,category_id,lat,lng,address,price,currency,visited,favorite,rating,notes,created_at) VALUES
(1,'Riverside Tower Walk',2,38.6916,-9.2160,'Riverside promenade (sample)',8,'EUR',0,1,5,'Go early, before the tour buses.',datetime('now','-20 days')),
(2,'Harbour Food Hall',1,38.7077,-9.1459,'Waterfront (sample)',NULL,'EUR',0,1,5,'Shared tables, many small stalls.',datetime('now','-20 days')),
(3,'Old Town Viewpoint',2,38.7128,-9.1287,'Old town hill (sample)',NULL,'EUR',1,1,4,'Best at sunset.',datetime('now','-19 days')),
(4,'Hilltop Guesthouse',3,38.7139,-9.1394,'City centre (sample)',140,'EUR',0,0,4,'Check-in from 15:00.',datetime('now','-18 days')),
(5,'Makers'' Market',4,38.7016,-9.1786,'West riverside (sample)',NULL,'EUR',0,0,4,'Open weekends only.',datetime('now','-15 days')),
(6,'Tiled Corner Café',1,38.7110,-9.1360,'Lower town (sample)',12,'EUR',0,0,4,NULL,datetime('now','-12 days')),
(7,'Botanical Garden Loop',2,38.7180,-9.1500,'Garden district (sample)',5,'EUR',0,0,3,'About an hour on foot.',datetime('now','-10 days'));

INSERT INTO trips (id,title,destination,start_date,end_date,notes,color,created_at) VALUES
(1,'Long weekend in Lisbon','Lisbon, Portugal',date('now','+14 days'),date('now','+16 days'),'Slow mornings, one big sight a day, dinner by the water.','amber',datetime('now','-9 days')),
(2,'Coast road trip (idea)','Atlantic coast',NULL,NULL,'Collect places first, pick dates later.','sky',datetime('now','-3 days'));

INSERT INTO trip_days (id,trip_id,day_index,date,title) VALUES
(1,1,1,date('now','+14 days'),'River and the west'),
(2,1,2,date('now','+15 days'),'Old town'),
(3,1,3,date('now','+16 days'),'Markets and departure');

INSERT INTO day_stops (id,day_id,poi_id,sort_order,arrive_time,duration_min,note) VALUES
(1,1,4,0,'15:00',30,'Drop the bags'),
(2,1,1,1,'16:00',90,NULL),
(3,1,2,2,'19:30',90,'Dinner'),
(4,2,6,0,'09:00',45,'Breakfast'),
(5,2,3,1,'10:30',60,NULL),
(6,2,7,2,'14:00',60,NULL),
(7,3,5,0,'10:00',90,NULL),
(8,3,2,1,'12:30',60,'Lunch before the airport');
