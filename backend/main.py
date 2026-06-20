from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# Force reload for new ttl data
from pydantic import BaseModel
from typing import List
import rdflib

app = FastAPI(title="Semantic Course Recommendation API")

# Allow CORS for Next.js Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load knowledge graph
print("Loading Knowledge Graph...")
g = rdflib.Graph()
# Assuming the file is run from the root directory, the ttl file is in the same directory
g.parse("university.ttl", format="turtle")
print(f"Loaded {len(g)} triples.")

class RecommendRequest(BaseModel):
    interests: List[str]
    completed_courses: List[str] = []

@app.get("/api/topics")
def get_topics():
    # Query all available topics from the ontology
    query = """
    PREFIX ex: <http://example.org/university#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    SELECT DISTINCT ?topicName WHERE {
        ?topic a ex:Topic ;
               rdfs:label ?topicName .
    }
    """
    results = g.query(query)
    topics = [str(row.topicName) for row in results]
    return {"topics": topics}

@app.get("/api/courses")
def get_courses():
    # Query all available courses from the ontology
    query = """
    PREFIX ex: <http://example.org/university#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    SELECT DISTINCT ?courseName WHERE {
        ?course a ex:Course ;
               rdfs:label ?courseName .
    }
    """
    results = g.query(query)
    courses = sorted([str(row.courseName) for row in results])
    return {"courses": courses}

@app.post("/api/recommend")
def recommend_courses(req: RecommendRequest):
    if not req.interests:
        return {"recommendations": []}

    # Format interests for SPARQL IN clause: e.g., "Machine Learning", "Data Science"
    interests_str = ", ".join([f'"{i}"' for i in req.interests])
    
    # Dynamic SPARQL Query: Find courses that cover the requested topics
    query = f"""
    PREFIX ex: <http://example.org/university#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

    SELECT DISTINCT ?courseName ?topicName
    WHERE {{
        ?course a ex:Course ;
                rdfs:label ?courseName ;
                ex:coversTopic ?topic .
        ?topic rdfs:label ?topicName .
        FILTER(?topicName IN ({interests_str}))
    }}
    """
    
    results = g.query(query)
    recommendations = []
    
    # Filter out completed courses manually since the user might not be in the RDF graph
    completed_lower = [c.lower() for c in req.completed_courses]
    
    for row in results:
        course_name = str(row.courseName)
        topic_name = str(row.topicName)
        
        if course_name.lower() not in completed_lower:
            recommendations.append({
                "course": course_name,
                "reason": f"Matches your interest in '{topic_name}'"
            })
            
    return {"recommendations": recommendations}

if __name__ == "__main__":
    import uvicorn
    # uvicorn backend.main:app --reload
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
