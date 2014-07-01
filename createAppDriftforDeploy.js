var groupName = args[0];
var jbossServerBase = "/srv/jboss/server/";
var blacklist = ["ROOT.war", "admin-console.war", "jmx-console.war", "VD.war"];

var rgc = new ResourceGroupCriteria();`
rgc.addFilterName(groupName);
rgc.fetchExplicitResources(true);
var groupList = ResourceGroupManager.findResourceGroupsByCriteria(rgc);

if( groupList == null || groupList.size() != 1 ) {
    println("Can't find a resource group named " + groupName);
    println("Or to many resoure groups found");
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
        println("Not a JBoss Server");
        continue;
    }

    var server = ProxyFactory.getResource(res.id);
    var children = server.children;
    for(c in children) {
        app = children[c];
        if (blacklist.indexOf(app.name) < 0) {
            println("Skipping...  " + app.name);
            continue;
        }
        else if (blacklist.indexOf(app.name) >= 0){
            println("Creating drift for " app.name);
            var driftObj = new deployDefinitionObj(app);
            driftObj.basedir(jbossServerBase + app.name + '/deploy');
            createDefinitionObj.(driftObj);
        }
    }
}

function deployDefinitionObj(app) {
    //Search for viable template in corresponding app instance.
    var criteria = DriftDefinitionTemplateCriteria();
    criteria.addFilterResourceTypeId(app.resourceType.id);
    var templates = DriftTemplateManager.findTemplatesByCriteria(criteria);

    if(templates != null || templates.size() > 0 ) {
        //Create search path filter './app.war'
        var f = new Filter('./',app.name);
        this.app = app
        this.basedir = function(deployDir) {
            this.definition.basedir = new DriftDefinition.BaseDirectory(
                DriftConfigurationDefinition.BaseDirValueContext.valueOf('fileSystem'), deployDir);
        };
        this.definition = templates.get(0).createDefinition();
        this.definition.resource = app;
        this.definition.name = app.name + "_detectDeploy"
        this.definition.description = app.name + " Application Deployment Drift Dectection"
        this.definition.setAttached(false);
        this.definition.setInterval(30);
        this.definition.addInclude(f);
        this.definition.setDriftHandlingMode(
            DriftConfigurationDefinition.DriftHandlingMode.valueOf('normal'));
    }
    else {
        println("There are no templates for this app skipping..");
        var this.definition = null;
    }
}

function createDefinitionObj(deployDefinitionObj) {
    if (! deployDefinitionObj.definition) {
        throw("Not a valid definition");
    }
    try {
        DriftManager.updateDriftDefinition(
            EntityContext.forResource(deployDefinitionObj.app.id), deployDefinitionObj.definition);
    }
    catch (e if javax.ejb.EJBException instanceof java.lang.IllegalArgumentException) {
        println('Cannt update' + deployDefinitionObj.app.name);
    }
}