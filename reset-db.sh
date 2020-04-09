#!/bin/bash

echo "restarting postgres to clear open connections."
sudo service postgresql restart
echo "Dropping and recreating database..."
psql -c "DROP DATABASE spoke;"
psql -c "CREATE DATABASE spoke;"
echo "Doing migrations..."
yarn knex migrate:latest
yarn migrate:worker
echo "inserting invite..."
./insert-invite.sh CheckUpOnMeDevelopment
echo "done... Starting spoke..."
yarn run dev
