#!/bin/bash

# Script to populate Neo4j using HTTP API
# This works without cypher-shell installed

NEO4J_URI="${NEO4J_URI:-http://localhost:7474}"
NEO4J_USER="${NEO4J_USER:-neo4j}"
NEO4J_PASSWORD="${NEO4J_PASSWORD:-password123}"

echo "🚀 Populating Neo4j Education Knowledge Graph"
echo "URI: $NEO4J_URI"
echo "User: $NEO4J_USER"
echo ""

# The Cypher query
QUERY='
// ================================================
// 🚀 Education Knowledge Graph
// Institutes | Faculties | Departments | Programs | Qualifications | Careers
// ================================================

// ---- 0. Wipe Database (Optional) ----
MATCH (n) DETACH DELETE n;

// ---- 1. Create Institutes ----
MERGE (ousl:Institute {name: "The Open University of Sri Lanka"})
MERGE (vta:Institute {name: "Vocational Training Authority (VTA)"})
WITH ousl, vta

// ---- 2. Create Faculty and Departments ----
MERGE (engFaculty:Faculty {name: "Faculty of Engineering Technology"})
MERGE (civil:Department {name: "Civil Engineering"})
MERGE (agri:Department {name: "Agricultural and Plantation Engineering"})
MERGE (elec:Department {name: "Electrical and Computer Engineering"})
MERGE (mech:Department {name: "Mechanical Engineering"})
MERGE (textile:Department {name: "Textile and Apparel Technology"})
WITH ousl, vta, engFaculty, civil, agri, elec, mech, textile

// ---- 3. Create Programs ----
MERGE (advCert:Program {name: "Advanced Certificate in Science"})
MERGE (bse:Program {name: "Bachelor of Software Engineering Honours"})
MERGE (compEng:Program {name: "BSc Honours in Engineering - Computer Engineering"})
MERGE (elecEng:Program {name: "BSc Honours in Engineering - Electrical Engineering"})
MERGE (ecommEng:Program {name: "BSc Honours in Engineering - Electronics and Communication Engineering"})
MERGE (civilEng:Program {name: "Civil Engineering Degree Programme"})
MERGE (mechEng:Program {name: "Mechanical Engineering Degree Programme"})
MERGE (mechaEng:Program {name: "Mechatronics Engineering Degree Programme"})
MERGE (agriEng:Program {name: "Bachelor of Technology Honours in Agricultural Engineering"})
MERGE (indAgri:Program {name: "Bachelor of Industrial Studies Honours in Agriculture"})
MERGE (texApp:Program {name: "Textile and Apparel Technology Degree Programme"})
MERGE (nvq3_ict:Program {name: "ICT Technician (NVQ Level 3)"})
MERGE (nvq4_hw:Program {name: "Computer Hardware Technician (NVQ Level 4)"})
WITH ousl, vta, engFaculty, civil, agri, elec, mech, textile,
     advCert, bse, compEng, elecEng, ecommEng, civilEng, mechEng, mechaEng, agriEng, indAgri, texApp, nvq3_ict, nvq4_hw

// ---- 4. Create Qualifications ----
MERGE (olQual:Qualification {name: "G.C.E. (O/L) Examination Pass"})
MERGE (ageQual:Qualification {name: "Age Requirement"})
MERGE (advCertQual:Qualification {name: "Completion of Advanced Certificate in Science"})
MERGE (alQual:Qualification {name: "G.C.E. (A/L) Examination Pass"})
MERGE (olFailQual:Qualification {name: "G.C.E. (O/L) Examination Not Passed"})
MERGE (nvq3_complete:Qualification {name: "Completion of NVQ Level 3 Program"})
MERGE (nvq4_complete:Qualification {name: "Completion of NVQ Level 4 Program (O/L Equivalent)"})
WITH ousl, vta, engFaculty, civil, agri, elec, mech, textile,
     advCert, bse, compEng, elecEng, ecommEng, civilEng, mechEng, mechaEng, agriEng, indAgri, texApp, nvq3_ict, nvq4_hw,
     olQual, ageQual, advCertQual, alQual, olFailQual, nvq3_complete, nvq4_complete

// ---- 5. Create Careers ----
MERGE (swe:Career {title: "Software Engineer"})
MERGE (qa:Career {title: "Quality Assurance Engineer"})
MERGE (devops:Career {title: "DevOps Engineer"})
MERGE (hwEng:Career {title: "Hardware Engineer"})
MERGE (netAdmin:Career {title: "Network Administrator"})
MERGE (civilEngCareer:Career {title: "Civil Engineer"})
MERGE (structEng:Career {title: "Structural Engineer"})
WITH *

// ---- 6. Institute / Faculty / Department Structure ----
MERGE (ousl)-[:HAS_FACULTY]->(engFaculty)
MERGE (engFaculty)-[:HAS_DEPARTMENT]->(civil)
MERGE (engFaculty)-[:HAS_DEPARTMENT]->(agri)
MERGE (engFaculty)-[:HAS_DEPARTMENT]->(elec)
MERGE (engFaculty)-[:HAS_DEPARTMENT]->(mech)
MERGE (engFaculty)-[:HAS_DEPARTMENT]->(textile)
MERGE (vta)-[:OFFERS]->(nvq3_ict)
MERGE (vta)-[:OFFERS]->(nvq4_hw)
WITH *

// ---- 7. Department Offers Programs ----
MERGE (elec)-[:OFFERS]->(bse)
MERGE (elec)-[:OFFERS]->(compEng)
MERGE (elec)-[:OFFERS]->(elecEng)
MERGE (elec)-[:OFFERS]->(ecommEng)
MERGE (civil)-[:OFFERS]->(civilEng)
MERGE (mech)-[:OFFERS]->(mechEng)
MERGE (mech)-[:OFFERS]->(mechaEng)
MERGE (agri)-[:OFFERS]->(agriEng)
MERGE (agri)-[:OFFERS]->(indAgri)
MERGE (textile)-[:OFFERS]->(texApp)
WITH *

// ---- 8. Program Requirements ----
MERGE (nvq3_ict)-[:REQUIRES]->(olFailQual)
MERGE (nvq4_hw)-[:REQUIRES]->(nvq3_complete)
MERGE (advCert)-[:REQUIRES]->(olQual)
MERGE (advCert)-[:REQUIRES]->(nvq4_complete)
MERGE (advCert)-[:REQUIRES]->(ageQual)
MERGE (bse)-[:REQUIRES]->(advCertQual)
MERGE (bse)-[:REQUIRES]->(alQual)
MERGE (compEng)-[:REQUIRES]->(advCertQual)
MERGE (compEng)-[:REQUIRES]->(alQual)
MERGE (elecEng)-[:REQUIRES]->(advCertQual)
MERGE (elecEng)-[:REQUIRES]->(alQual)
MERGE (ecommEng)-[:REQUIRES]->(advCertQual)
MERGE (ecommEng)-[:REQUIRES]->(alQual)
MERGE (civilEng)-[:REQUIRES]->(advCertQual)
MERGE (civilEng)-[:REQUIRES]->(alQual)
MERGE (mechEng)-[:REQUIRES]->(advCertQual)
MERGE (mechEng)-[:REQUIRES]->(alQual)
MERGE (mechaEng)-[:REQUIRES]->(advCertQual)
MERGE (mechaEng)-[:REQUIRES]->(alQual)
MERGE (agriEng)-[:REQUIRES]->(advCertQual)
MERGE (agriEng)-[:REQUIRES]->(alQual)
MERGE (indAgri)-[:REQUIRES]->(advCertQual)
MERGE (indAgri)-[:REQUIRES]->(alQual)
MERGE (texApp)-[:REQUIRES]->(advCertQual)
MERGE (texApp)-[:REQUIRES]->(alQual)
WITH *

// ---- 9. Prerequisite Chains ----
MERGE (nvq3_ict)-[:IS_PREREQUISITE_FOR]->(nvq4_hw)
MERGE (advCert)-[:IS_PREREQUISITE_FOR]->(bse)
MERGE (advCert)-[:IS_PREREQUISITE_FOR]->(compEng)
MERGE (advCert)-[:IS_PREREQUISITE_FOR]->(elecEng)
MERGE (advCert)-[:IS_PREREQUISITE_FOR]->(ecommEng)
MERGE (advCert)-[:IS_PREREQUISITE_FOR]->(civilEng)
MERGE (advCert)-[:IS_PREREQUISITE_FOR]->(mechEng)
MERGE (advCert)-[:IS_PREREQUISITE_FOR]->(mechaEng)
MERGE (advCert)-[:IS_PREREQUISITE_FOR]->(agriEng)
MERGE (advCert)-[:IS_PREREQUISITE_FOR]->(indAgri)
MERGE (advCert)-[:IS_PREREQUISITE_FOR]->(texApp)
WITH *

// ---- 10. Career Paths ----
MERGE (bse)-[:LEADS_TO]->(swe)
MERGE (bse)-[:LEADS_TO]->(qa)
MERGE (bse)-[:LEADS_TO]->(devops)
MERGE (compEng)-[:LEADS_TO]->(swe)
MERGE (compEng)-[:LEADS_TO]->(hwEng)
MERGE (compEng)-[:LEADS_TO]->(netAdmin)
MERGE (nvq4_hw)-[:LEADS_TO]->(hwEng)
MERGE (civilEng)-[:LEADS_TO]->(civilEngCareer)
MERGE (civilEng)-[:LEADS_TO]->(structEng)
RETURN "✅ Database populated successfully!" AS status;
'

# Execute the query using Neo4j HTTP API
curl -X POST "$NEO4J_URI/db/neo4j/tx/commit" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -u "$NEO4J_USER:$NEO4J_PASSWORD" \
  -d "{\"statements\": [{\"statement\": $(echo "$QUERY" | jq -Rs .)}]}" \
  | jq .

echo ""
echo "✅ Database population complete!"
echo ""
echo "You can now test the API endpoints:"
echo "  curl http://localhost:8080/api/v1/pathway/institutes"
echo "  curl http://localhost:8080/api/v1/pathway/careers"
