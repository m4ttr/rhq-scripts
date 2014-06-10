var groupName = args[0];
var jbossServerBase = "/srv/jboss/server/"
var blacklist = ["ROOT.war","admin-console.war","jmx-console.war","VD.war"];

var warResId = findResourceId("Web Application (WAR)");
var earResId = findResourceId("Enterprise Application (EAR)");

var rgc = new ResourceGroupCriteria();
rgc.addFilterName(groupName);
rgc.fetchExplicitResources(true);
var groupList = ResourceGroupManager.findResourceGroupsByCriteria(rgc);

if( groupList == null || groupList.size() != 1 ) {
        println("Can't find a resource group named " + groupName);
    println("Or to many resoure groups found")
        throw "Exiting";
}

var group = groupList.get(0);

if( group.explicitResources == null || group.explicitResources.size() == 0 ) {
        println("  Group does not contain explicit resources --> exiting!" );
        throw "Exiting";
}

var resourcesArray = group.explicitResources.toArray();

for( i in resourcesArray ) {
    var res = resourcesArray[i];
    var resName = res.resourceType.name;

    if( resName != "JBossAS Server") {
        println("Not a JBoss Server")
        continue
    }

    var server = ProxyFactory.getResource(res.id);
    var children = server.children;
    for(c in children) {
        app = children[c];
        if(app.name == "ROOT.war" || app.name == "admin-console.war" || app.name == "jmx-console.war" || app.name == "VD.war" || app.name == "web-console.war") {
            continue
        }
        var resTypeId = app.resourceType.id;
        if(resTypeId == warResId) {
            var templateName = "war_deploy_drift-template";
        }
        else if(resTypeId == earResId) {
            var templateName = "ear_deploy_drift-template";
        }
        else {
            continue
        }
        var rcrit = ResourceCriteria();
        rcrit.addFilterId(app.id);
        var resources = ResourceManager.findResourcesByCriteria(rcrit)
        var appres = resources.get(0);
        createDriftDefinition(appres, resTypeId, jbossServerBase, templateName);
    }
}


function findResourceId(resTypeName){
    var criteria = new ResourceCriteria();
    criteria.addFilterResourceTypeName(resTypeName);
    resources = ResourceManager.findResourcesByCriteria(criteria);
    var resourcesArray = resources.toArray();
    if(resourcesArray == null || resources.size() < 1) {
        println("No Resources by specified type");
        throw ("Cant find the resource type");
    }
    //Just pull first item and return id;
    var res = resourcesArray[0];
    var resId = res.resourceType.id;
    return resId
}

function createDriftDefinition(app, resTypeId, jbossServerBase, templateName) {
    var criteria = DriftDefinitionTemplateCriteria();
    criteria.addFilterResourceTypeId(app.resourceType.id);
    //criteria.addFilterName(templateName);
    templates = DriftTemplateManager.findTemplatesByCriteria(criteria);
    if(templates == null || templates.size() < 1 ) {
                println("There are no templates");
                throw ("No templates configures for this resourceType");
    }
    templateArray = templates.toArray();
    for (t in templateArray) {
        var template = templateArray[t];
        println("Template Name:" + template.name);
        if (template.name == templateName) {
            var deployDir = jbossServerBase + groupName + '/deploy';
            var basedir = new DriftDefinition.BaseDirectory(DriftConfigurationDefinition.BaseDirValueContext.valueOf('fileSystem'), deployDir);
            var definition = template.createDefinition();
            definition.resource = app;
            definition.name = app.name + "_detect";
            definition.description = app.name + " Deployment Drift Alert";
            definition.setAttached(true);
            definition.basedir = basedir;
            definition.setInterval(30);
            var f = new Filter('./',app.name);
            definition.addInclude(f);
            definition.setDriftHandlingMode(DriftConfigurationDefinition.DriftHandlingMode.valueOf('normal'));
            DriftManager.updateDriftDefinition(EntityContext.forResource(app.id),definition)
            println("Creating Drift for:" + app.name)
        }
    }
}