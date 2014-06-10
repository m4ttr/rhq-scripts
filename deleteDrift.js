var term = args[0];

deleteDriftByKeyword(term);

function deleteDriftByKeyword(searchTerm) {
    var criteria = DriftDefinitionCriteria();
    criteria.addFilterName(searchTerm);
   	var res = DriftManager.findDriftDefinitionsByCriteria(criteria);

    if (res.size() > 1) {
        resArray = res.toArray()
            for (id in resArray) {
                deleteDrift(resArray[id])
            }
    }
    else if (res.isEmpty() || res == 'null') {
        deleteDrift(id)
    }
    else {
        println("No results found for " + searchTerm)
    }
}

function deleteDrift(driftDef) {
    driftObj = driftDef
    DriftManager.deleteDriftDefinition(EntityContext.forResource(driftObj.resource.id), driftObj.name)
}
