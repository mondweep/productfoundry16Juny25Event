#!/bin/bash

# Simple bridge script that forwards stdin/stdout to the HTTP server
while IFS= read -r line; do
  # Send the request to the HTTP server and get the response
  response=$(curl -s -X POST http://localhost:3003 \
    -H "Content-Type: application/json" \
    -d "$line")
  
  # Output the response
  echo "$response"
done