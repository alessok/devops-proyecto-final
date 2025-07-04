import jenkins.model.*
import hudson.tools.*
import jenkins.plugins.nodejs.tools.*

def jenkins = Jenkins.getInstance()

// Configurar NodeJS
def nodeJS = jenkins.getDescriptor("jenkins.plugins.nodejs.tools.NodeJSInstallation")

def nodeJSInstaller = new NodeJSInstallation(
    "NodeJS-20",           // name
    "/usr",                // home (directorio padre de bin/)
    null                   // properties
)

nodeJS.setInstallations(nodeJSInstaller)
nodeJS.save()

jenkins.save()

println("NodeJS 20 configurado exitosamente en Jenkins")
