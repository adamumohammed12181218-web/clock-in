stack

name of the project:Oasis TimeMark.

projecct overview: basically a student IT intern attenndance for sandlip oasis student can scan QR code to either clock-in or clock-out or using the website.
how it work:
admin portal: admin will be the one to create a location and QR code and i can change the location and the can just do it once in a day. and admin has power to do anything and admin can chenge the location.

users:
first student can visit a website and student can only sign in at once in a day and at the  registration the student ip address and mac address are save to the database which will be used to mark the attendance. once the the user at register with aunique ip address is issue  and it only work with the register with or tied to the mac and ip address. the unique clock ip  address only work with the  register device. every the student visit thier website amd clock-in with their clock-in id. every the student visit the website the system valisate the ip address or mac address and then approves the student. friends or other person can not log in to you. attendance is recorded in postgreSQL, the calender and everything will be sync with the current date calender.

api:
for public API location tracking we use the api that were free such as open free map, location iQ

bar code:
bwip--js

frontend1: html,css,javascript
frontend2: svelte and javascript
backend: node.js, express
database: postgreSQL (superbase)

