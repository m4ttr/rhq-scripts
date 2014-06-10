// set some defaults
//var groupName = "estoredev1" ;
//var fileName = "nwna.war" ;
// The following 3 vars are extracted from the given fileName
var packageName;
var packageType;
var packageVersion;
var fileBytes;
// check and parse parameters
if( args.length < 2) {
        usage();
}

fileName = args[0];
groupName = args[1];

// check to see if the file exists and is readable by us.
var file = new java.io.File(fileName);

if( !file.exists() ) {
        println(fileName + " does not exist!");
        usage();
}

if( !file.canRead() ) {
        println(fileName + " can't be read!");
        usage();
}

// parse pathName to generate packageName
var packageParser = new PackageParser(fileName);
var packageName = packageParser.packageName;
var packageType = packageParser.packageType;
var packageVersion = packageParser.version;
var fileBytes = packageParser.fileBytes;


println("About to deploy " + packageName + " of type " + packageType + " with version " + packageVersion + " to group " + groupName );

// find resource group
var rgc = new ResourceGroupCriteria();
rgc.addFilterName(groupName);
rgc.fetchExplicitResources(true);
var groupList = ResourceGroupManager.findResourceGroupsByCriteria(rgc);

if( groupList == null || groupList.size() != 1 ) {
        println("Can't find a resource group named " + groupName);
        usage();
}

var group = groupList.get(0);

println("  Found group: " + group.name );
println("  Group ID   : " + group.id );
println("  Description: " + group.description);

if( group.explicitResources == null || group.explicitResources.size() == 0 ) {
        println("  Group does not contain explicit resources --> exiting!" );
        usage();
}

var resourcesArray = group.explicitResources.toArray();

for( i in resourcesArray ) {
        var res = resourcesArray[i];
        var resType = res.resourceType.name;
        println("  Found resource " + res.name + " of type " + resType + " and ID " + res.id);


        if( resType != "JBossAS Server") {
                println("    ---> Resource not of required type. Exiting!");
                usage();
        }

        // get server resource to start/stop it and to redeploy application
        var server = ProxyFactory.getResource(res.id);

        // we need check to see if the given server is up and running
        var avail = AvailabilityManager.getCurrentAvailabilityForResource(server.id);

        // infortunately, we can only proceed with deployment if the server is running. Why?
        if( avail.availabilityType.toString() == "DOWN" ) {
                println("  Server is DOWN. Please first start the server and run this script again!");
                println("");
                continue;
        }

        var children = server.children;
        for( c in children ) {
                var child = children[c];
                var childFound = false;
                if( child.name == packageName ) {
                        var childFound = true;
                        if( child.backingContent.packageVersion.displayVersion != packageVersion ) {
                                println("    found child: " + child.name + " of ID " + child.id);
                                println(packageVersion)
                                println("    uploading new application code");
                                child.updateBackingContent(fileName, packageVersion);

                                println("    done!");

                        }
                }
                if ( childFound ) { break; }
        }
println(childFound);
        // If the specified package does not exist, create a new one and upload it to the server
        if( childFound == false ) {
                // first we need the resourceType of the app
                var appTypeName = "Web Application (WAR)";
                if( packageType == "war" ) {
                        appTypeName = "Web Application (WAR)";
                }
                else if( packageType == "ear" ) {
                        appTypeName = "Enterprise Application (EAR)";
                }
                else {
                        println("  Unknown package type: " + packageType);
                        usage();
                }

                // find it
                var appType = ResourceTypeManager.getResourceTypeByNameAndPlugin( appTypeName, "JBossAS5" );

                if( appType == null ) {
                        println("  Could not find application type. Exit.");
                        usage();
                }

                println("AppTypeName: "+ appTypeName);
                println("AppType: "+ appType);

                // now get the jon package type
                var realPackageType = ContentManager.findPackageTypes( appTypeName, "JBossAS" );

                if( realPackageType == null ) {
                        println("  Could not find RHQ's packageType. Exit.");
                        usage();
                }

                // create deployConfig
                var deployConfig = new Configuration();
                deployConfig.put( new PropertySimple("deployExploded", "false"));
                deployConfig.put( new PropertySimple("deployFarmed", "false"));


                // create & upload resource
                // NOTE: The JBossAS server must be up and running
                ResourceFactoryManager.createPackageBackedResource(
                        server.id,
                        appType.id,
                        packageName,
                        null,  // pluginConfiguration
                        packageName,
                        packageVersion,
                        null, // architectureId
                        deployConfig,
                        fileBytes,
                        null // Timeout
                );
        }
}


function usage() {
        println("Usage: deployToGroup <fileName> <groupName>");
        throw "Illegal arguments";
}


function PackageParser(fullPathName) {
        var file = new java.io.File(fullPathName);
        var jar = new java.util.jar.JarFile(file);
        var manifest = jar.getManifest();
        var inputStream = new java.io.FileInputStream(file);
        var fileLength = file.length();
        var fileBytes = java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE, fileLength);
        for (numRead=0, offset=0; ((numRead >= 0) && (offset < fileBytes.length)); offset += numRead ) {
            numRead = inputStream.read(fileBytes, offset, fileBytes.length - offset);
        }

        var attributes = jar.getManifest().getMainAttributes();
        var version = attributes.getValue("Implementation-Version");

        var fileName = file.getName();
        var packageType = fileName.substring(fileName.lastIndexOf('.')+1);
//      var tmp = fileName.substring(0, fileName.lastIndexOf('.'));
        var realName = fileName.substring(0, fileName.lastIndexOf('.'));
//      var realName = tmp.substring(0, tmp.lastIndexOf('.'));
        var packageName = realName + "." + packageType;

        this.packageType = packageType.toLowerCase();
        this.packageName = packageName;
        this.version     = version;
        this.realName    = realName;
        this.fileBytes   = fileBytes;
}
