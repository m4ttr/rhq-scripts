var term = args[0];

function deleteDriftByKeyword(searchTerm, callback) {
    var criteria = DriftDefinitionCriteria();
    criteria.addFilterName(searchTerm);
   	var res = DriftManager.findDriftDefinitionsByCriteria(criteria);

    if (res.size() > 1) {
        resArray = res.toArray()
            for (id in resArray) {
                callback(resArray[id])
            }
    }
    else if (res.isEmpty() || res == 'null') {
        println('No drift definitions match' + searchTerm)
    }
}

var deleteDrit = function(driftDef) {
    try {
        DriftManager.deleteDriftDefinition(EntityContext.forResource(driftDef.resource.id), driftDef.name);
    }
    catch (e if javax.ejb.EJBException instanceof java.lang.IllegalArgumentException) {
        println('driftDef not found!');

    }
}

deleteDriftByKeyword(term, deleteDrift);