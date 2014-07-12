#RHQ-Scripts

Deployment Automation and Notification in RHQ JBoss Operations Network(JON)
===========================================================================
Setup Deployment automation using these scripts within your CI server or Git Hooks.  Email alerts generated by RHQ arn't very customizable.  with emailDeploy.js we generate our own from a template.

#### Prerequisites ####
* Setup capatibility groups containing the JVM being deployed to. 
* Use GitHooks or CI Server to kickoff deployToGroup.js


##Usage:##

###Deploy Application###

Implementation-Version number in META-INF/MANIFEST.MF is a required parameter for each applicaiton.

```
rhq-remoting-cli/bin/rhq-cli.sh -f deployToGroup.js (application.war|application.ear) <groupName>
```

###Send deploy notification###

Create an alert definition for drift, regex (.*?_deployDetect$). CLI Script as notification parameter.

> The Implemntation-Version number will be read from JON and an email notification will be sent on behalf of emailDeploy.js with app name and version number.

###Create DriftDefinitions### 

```
rhq-remoting-cli/bin/rhq-cli.sh -f createAppDriftforDeploy.js <group>
Creats definitions for deployed ear or war files in JBossAS5 JVMs.
```

###Delete DriftInstances###

Delete drift definitions by searchTerm

```
rhq-remoting-cli/bin/rhq-cli.sh -f deleteDrifts.js <searchTerm>
```

