// DEQ Plugin: iframe v1.0
DigitalEventQueue.plugin = DigitalEventQueue.plugin || {};
DigitalEventQueue.plugin.iframe = function(queueName) {
    if(window.self==window.top) {
        var processMsg = function(msg) {
            if(msg && msg.data && msg.data.eventName && msg.data.eventData && msg.data.eventData.deq_iframe) {
                var queue = new DigitalEventQueue(queueName);
                queue.push({
                    command:    'ADD EVENT',
                    name:       msg.data.eventName,
                    data:       msg.data.eventData,
                });
            }
        }
        window.addEventListener("message", processMsg, false);
    } else {
        var queue = new DigitalEventQueue(queueName);
        queue.push({
            command:    'ADD LISTENER',
            name:       'iframe plugin',
            matchEvent: '..*',
            handler:    function(event,data,queue) {
                data = data || {};
                data.deq_iframe = 1; 
                parent.postMessage({eventName:event,eventData:data},"*");
            }
        })
    }
}
/*! init plugin: iframe("My Queue Name") */
DigitalEventQueue.plugin.iframe("My iFrame Queue Name");