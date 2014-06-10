importClass(Packages.java.rmi.RemoteException);
importClass(Packages.java.util.Properties);
importClass(Packages.javax.mail.Message);
importClass(Packages.javax.mail.MessagingException);
importClass(Packages.javax.mail.Session);
importClass(Packages.javax.mail.Transport);
importClass(Packages.javax.mail.internet.AddressException);
importClass(Packages.javax.mail.internet.InternetAddress);
importClass(Packages.javax.mail.internet.MimeMessage);

var app = ProxyFactory.getResource(alert.alertDefinition.resource.id);
var app_res = ResourceManager.getResource(alert.alertDefinition.resource.id)

var anc = app_res.getAncestry()

var app_name = app.name;
var app_version = app.backingContent.packageVersion.displayVersion;

var jvm_name = (/[\s.\s](\w+?)\_/.exec(anc)[1])
var host_name = (/\w+-{1}\w+\d{2,3}/.exec(anc)[0])

var email_template = "/opt/rhq-remoting-cli/automation/email_template.html"
var file = new java.io.FileInputStream(email_template);
var content = new java.util.Scanner(file).useDelimiter("\\Z").next();
var email_content = String(content);

email_content = email_content.replace('jvm_name', jvm_name);
email_content = email_content.replace('host_name', host_name);
email_content = email_content.replace('app_name', app_name);
email_content = email_content.replace('app_version', app_version);

var app_name_str = String(jvm_name);

props = new java.util.Properties;
props.setProperty("mail.transport.protocol", "smtp");
props.setProperty("mail.host", "localhost");
session = Session.getDefaultInstance(props, null);
message = new MimeMessage(session);

    try {
	    message.setContent(email_content,"text/html");
	    message.addHeader("Content-Type", "text/html");
	    message.setSender(new InternetAddress("alerts@example.com"));
	    message.setSubject("JBoss Deployment: " + jvm_name + ' on ' + host_name  );
	    //message.setText(email_content);
	    if (app_name_str.match(/qa/)) {
	    	message.addRecipient(Message.RecipientType.TO,new InternetAddress("qa@example.com"));
	    }
	    message.addRecipient(Message.RecipientType.TO,new InternetAddress("alerts@example.com"));
	    message.addRecipient(Message.RecipientType.TO,new InternetAddress("jboss_application_owners@example.com"));
	    Transport.send(message);
	    }
    finally {
    }
