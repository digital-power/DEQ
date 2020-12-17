// DEQ Plugin: iframe v1.0
if(window.self==window.top) {
    var processMsg = function(msg) {
        if(msg && msg.data && msg.data.eventName && msg.data.eventData && msg.data.queueName) {
            var queue = new DigitalEventQueue(msg.data.queueName);
            queue.push({
                command:    'ADD EVENT',
                name:       msg.data.eventName,
                data:       msg.data.eventData,
            });
        }
    }
    window.addEventListener("message", processMsg, false);
} else {
    Object.keys(DigitalEventQueue.queue).forEach(function(queue){
        DigitalEventQueue.queue[queue].push({
            command:    'ADD LISTENER',
            name:       'iframe plugin',
            matchEvent: '..*',
            handler:    function(event,data,queue) {
                data = data || {};
                data.deq_iframe = "true"; 
                parent.postMessage({eventName:event,eventData:data,queueName:queue.name},"*");
            }
        })
    });
}