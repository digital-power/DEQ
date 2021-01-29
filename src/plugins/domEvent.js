/*! DEQ Plugin: domEvent v1.01 */
DigitalEventQueue.plugin = DigitalEventQueue.plugin || {};
DigitalEventQueue.plugin.domEvent = function(domEvent,requiredAttribute,queueName) {

    document.addEventListener(domEvent, function(event){

        if(typeof(event.target)=="object" && event.target!=null) {
        
            var attributeToKey = function(attr) {
                return attr.replace(/-/g,"_").replace(/data/,"html").toLowerCase();
            }

            var getAttributesRecursive = function(element,data) {

                var attributes = element.getAttributeNames();
                attributes.forEach(function(attribute) {
                    if(attribute.indexOf("data-")==0) {
                        var key =  attributeToKey(attribute);
                        if(typeof(data[key])=="undefined") {
                            data[key] = element.getAttribute(attribute);                          
                        }                    
                    }
                }); 
                
                if(typeof(element.parentElement=="object") && element.parentElement!=null) {
                    getAttributesRecursive(element.parentElement,data);
                }                          
            }

            var data = {}            
            getAttributesRecursive(event.target,data);
            
            if(requiredAttribute==null || typeof(requiredAttribute)=="undefined" || typeof(data[attributeToKey(requiredAttribute)])!="undefined") {
                var queue = new DigitalEventQueue(queueName);
                queue.push({ command: 'ADD EVENT', name: domEvent, data: data});
            }
        }
    });
}
/*! init plugin: domEvent(listenForDomEvent,requiredDataAttribute, queueName) */
DigitalEventQueue.plugin.domEvent("click","data-demo-attribute","My Queue Name");
DigitalEventQueue.plugin.domEvent("mousedown","data-demo-attribute","My Queue Name");