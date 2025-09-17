from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
import uvicorn
from fastapi.middleware.cors import CORSMiddleware
from collections import defaultdict
import heapq

# Initialize FastAPI app
app = FastAPI()

# Enable CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Data models for API requests and responses ---
class TrainInfo(BaseModel):
    id: str

class YardData(BaseModel):
    tracks: List[Dict]
    points: List[Dict]
    platforms: List[Dict]
    signals: List[Dict]
    labels: List[Dict]

class RouteRequest(BaseModel):
    train_id: str
    yard_data: YardData

class RouteSuggestion(BaseModel):
    id: str
    route: List[str]

# --- Refined AI Logic (Optimization Module) ---
def build_graph(yard_data):
    """
    Builds a graph representation of the railway yard from the provided data.
    """
    graph = defaultdict(dict)
    
    all_components = {item['id']: item for item in yard_data.tracks + yard_data.points + yard_data.platforms}

    def get_endpoints_from_d(d_attr):
        """Helper to extract numerical endpoints from an SVG path string."""
        parts = d_attr.split(' ')
        coords = [p for p in parts if p.isdigit()]
        if len(coords) >= 4:
            start_point = (int(coords[0]), int(coords[1]))
            end_point = (int(coords[-2]), int(coords[-1]))
            return start_point, end_point
        return None, None

    # First, create all nodes in the graph
    for comp_id in all_components:
        graph[comp_id] = {}

    # Then, find and create all the edges based on shared endpoints
    for id1, comp1 in all_components.items():
        if 'd' in comp1:
            start1, end1 = get_endpoints_from_d(comp1['d'])
            if end1 is None:
                continue
            
            for id2, comp2 in all_components.items():
                if 'd' in comp2 and id1 != id2:
                    start2, end2 = get_endpoints_from_d(comp2['d'])
                    if start2 is None:
                        continue
                    
                    # Check for a connection (shared start/end point)
                    if end1 == start2:
                        weight = 1  # Simplified, all weights are equal
                        graph[id1][id2] = weight
    
    # --- Manual connections for complex/disjoint parts ---
    # This is a crucial step to ensure the graph is fully connected.
    # It links the points to the main lines.
    graph['P_W_UP_PL3']['PL3'] = 1
    graph['P_W_UP_PL4']['PL4'] = 1
    graph['PL3']['P_E_PL3_UP'] = 1
    graph['PL4']['P_E_PL4_UP'] = 1
    graph['P_E_PL4_UP']['T_E_UP_OUT'] = 1
    graph['P_E_PL3_UP']['T_E_UP_OUT'] = 1
    
    # Connect main lines to yard points
    graph['ML_UP']['P_W_UP_PL3'] = 1
    graph['ML_UP']['P_W_UP_PL4'] = 1
    
    # Correcting entry/exit points
    graph['T_W_UP_IN']['ML_UP'] = 1
    graph['ML_UP']['P_E_PL3_UP'] = 1
    graph['ML_UP']['P_E_PL4_UP'] = 1
    graph['ML_UP']['P_E_PL1_UP'] = 1

    # Add bi-directional connections where appropriate
    for node1, neighbors in list(graph.items()):
        for node2, weight in neighbors.items():
            graph[node2][node1] = weight

    return graph

def find_shortest_path(graph, start, end, occupied_tracks):
    """
    Finds the shortest path using Dijkstra's algorithm.
    It considers occupied tracks as blocked.
    """
    if start not in graph or end not in graph:
        return None, "Start or end node not in graph"
        
    blocked = set(occupied_tracks)
    distances = {node: float('inf') for node in graph}
    distances[start] = 0
    previous_nodes = {}
    pq = [(0, start)]

    while pq:
        current_distance, current_node = heapq.heappop(pq)
        
        if current_node in blocked:
            continue

        if current_node == end:
            path = []
            while current_node is not None:
                path.insert(0, current_node)
                current_node = previous_nodes.get(current_node)
            return path, "Path found"
        
        if current_distance > distances[current_node]:
            continue

        for neighbor, weight in graph.get(current_node, {}).items():
            if neighbor not in blocked:
                distance = current_distance + weight
                if distance < distances[neighbor]:
                    distances[neighbor] = distance
                    previous_nodes[neighbor] = current_node
                    heapq.heappush(pq, (distance, neighbor))
    
    return None, "No path found"

@app.post("/api/get-route", response_model=RouteSuggestion)
async def get_route_suggestion(request: RouteRequest):
    """
    API endpoint that returns an AI-suggested route based on
    dynamic platform selection.
    """
    # A dictionary mapping train IDs to their preferred platforms
    train_preferences = {
        '19670': 'PL4', # Humsafar Express
        '22500': 'PL3', # Vande Bharat
        '12381': 'PL1', # Poorva Express
        '12165': 'PL5'  # LTT GKP SF EXP
    }

    # Simulate occupied platforms from a different route
    occupied_platforms = ['PL3']

    # Get a list of available platforms
    available_platforms = [p['id'] for p in request.yard_data['platforms'] if p['id'] not in occupied_platforms]

    # Select a destination platform based on train ID preferences
    destination_platform = train_preferences.get(request.train_id, None)
    if not destination_platform or destination_platform not in available_platforms:
        # If preferred platform is occupied or not found, pick the first available one
        if available_platforms:
            destination_platform = available_platforms[0]
        else:
            raise HTTPException(status_code=404, detail="No platforms are available.")
            
    # Determine start and end nodes based on train direction and destination
    # This logic needs to be based on the yard topology
    start_node = 'T_W_UP_IN'
    final_exit_node = 'T_E_UP_OUT'

    if request.train_id == 'ShivGanga' or '12165': # Assuming ShivGanga and 12165 come from the east
        start_node = 'T_E_DOWN_IN'
        final_exit_node = 'T_W_DOWN_OUT'

    # Build the graph dynamically
    graph = build_graph(request.yard_data)

    # Find the shortest path from entry point to the selected platform
    path_to_platform, status = find_shortest_path(graph, start_node, destination_platform, occupied_tracks)
    
    if not path_to_platform:
        raise HTTPException(status_code=404, detail=f"No path found to platform {destination_platform}.")

    # Now, find the path from the platform to the exit
    path_from_platform, status_exit = find_shortest_path(graph, destination_platform, final_exit_node, occupied_tracks)

    if not path_from_platform:
        raise HTTPException(status_code=404, detail=f"No exit path found from platform {destination_platform}.")

    # Combine the two paths
    full_route = path_to_platform + path_from_platform[1:]

    return RouteSuggestion(id=request.train_id, route=full_route)

    
if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)