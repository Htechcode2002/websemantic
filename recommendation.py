import rdflib

def main():
    print("Initializing Semantic Knowledge Graph...")
    g = rdflib.Graph()
    
    # Load the RDF data (Turtle format)
    g.parse("university.ttl", format="turtle")
    print(f"Loaded {len(g)} triples.\n")

    # ==========================================
    # Phase 3: Querying (SPARQL)
    # ==========================================
    # We want to recommend courses to a student based on their interests,
    # EXCLUDING courses they have already completed.
    query = """
    PREFIX ex: <http://example.org/university#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

    SELECT ?studentName ?courseName ?topicName
    WHERE {
        # Find the student and their interests
        ?student a ex:Student ;
                 rdfs:label ?studentName ;
                 ex:hasInterest ?topic .
                 
        ?topic rdfs:label ?topicName .

        # Find courses that cover that topic
        ?course a ex:Course ;
                rdfs:label ?courseName ;
                ex:coversTopic ?topic .
                
        # CRITICAL RULE: The student must NOT have completed the course
        FILTER NOT EXISTS {
            ?student ex:hasCompleted ?course .
        }
    }
    """

    print("Executing SPARQL Recommendation Query...\n")
    results = g.query(query)

    print("RECOMMENDED COURSES:")
    print("=" * 60)
    for row in results:
        print(f"Student   : {row.studentName}")
        print(f"Course    : {row.courseName}")
        print(f"Reason    : Matches interest in '{row.topicName}'")
        print("-" * 60)

if __name__ == "__main__":
    main()
