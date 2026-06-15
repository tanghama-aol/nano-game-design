#!/bin/bash
export no_proxy=localhost,127.0.0.1

echo "1. Configure Settings..."
curl -s -X POST http://localhost:3001/api/settings \
  -H "Content-Type: application/json" \
  -d '{"authMode": "GEMINI", "geminiApiKey": "fake-key", "maxConcurrency": 2}'

echo -e "\n\n2. Generate Tree (Simulated)..."
# We expect this to fail or return mock because key is fake, but we want to see if code crashes
curl -s -X POST http://localhost:3001/api/generate-tree \
  -H "Content-Type: application/json" \
  -d '{"concept": "A pixel art cat warrior"}'

echo -e "\n\n3. Generate Prompts (Simulated)..."
# Using a mock node list
curl -s -X POST http://localhost:3001/api/generate-prompts \
  -H "Content-Type: application/json" \
  -d '{
    "globalStyle": "Pixel Art",
    "nodes": [
      {"id": "node1", "name": "Cat Warrior", "type": "Character", "prompt": "cat warrior"}
    ]
  }'

echo -e "\n\n4. Save Project..."
curl -s -X POST http://localhost:3001/api/projects/save \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Project",
    "treeData": [{"id": "node1", "name": "Cat Warrior", "type": "Character", "prompt": "cat warrior", "status": "pending"}]
  }' > project_res.json
cat project_res.json

PROJ_ID=$(cat project_res.json | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
echo -e "\n\nProject ID: $PROJ_ID"

echo -e "\n5. Start Generation (Queue)..."
curl -s -X POST http://localhost:3001/api/projects/generate \
  -H "Content-Type: application/json" \
  -d "{\"projectId\": \"$PROJ_ID\"}"

echo -e "\n\nWaiting for queue..."
sleep 5

echo -e "\n6. Check Project Status (Load)..."
curl -s http://localhost:3001/api/projects/load

echo -e "\n\n7. Export..."
curl -s -I http://localhost:3001/api/projects/export/$PROJ_ID
