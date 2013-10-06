#!/bin/sh
service opxi2irar stop
service redis stop
rm -rf  /var/lib/redis/dump.rdb
service redis start
forever restartall
psql -U postgres opxi2agent -c "delete from atm_event"
