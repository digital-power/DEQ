describe('DigitalEventQueue', function(){
    function generateDEQName() {
        return "test" + Object.keys(DEQFactory.getAll()).length.toString();
    }

    context('Initialization', function(){
        before(function(){
            // Setup event queue
            window.digitalEventQueue = DEQFactory.get(generateDEQName(), window.digitalEventQueue);
            // console.log('created window.digitalEventQueue');
        });

        it('should be able to initialize', function() {
            expect(digitalEventQueue).to.exist;
                //.and.to.be.an.instanceOf(DigitalEventQueue);
            expect(digitalEventQueue).to.have.a.property('events')
                .that.is.an('Array');
            expect(digitalEventQueue).to.have.a.property('listeners')
                .that.is.an('Array');
            expect(digitalEventQueue).to.have.a.property('push')
                .that.is.a('function');
        });
    });

    context('Process commands already in the array', function(){
        before(function(){
            window.deq = [{command: "add event", name: "test event", data: {}}, {command: "add listener", name: "test listener", handler: function(){}, matchEvent: ".*"}];
        });

        after(function(){
            delete window.deq;
        });

        it('should not exists when starting the test', function(){
            expect(window.deq).to.be.an.instanceOf(Array);
            expect(window.deq).to.have.lengthOf(2);   // One event, one listener
        });

        it('should process all events in the pre-existing array', function(){
            window.deq = DEQFactory.get(generateDEQName(), window.deq); // Create queue, based on current array
            expect(window.deq.events).to.be.an.instanceOf(Array).and.to.have.lengthOf(1);
            expect(window.deq.listeners).to.be.an.instanceOf(Array).and.to.have.lengthOf(1);
        });
    });

    context('Adding events', function(){
        before(function(){
            window.deq = DEQFactory.get(generateDEQName());
        });

        after(function(){
            delete window.deq;
        });


        it('should have no registered events when this test starts', function(){
            var previous_events = window.deq.events.slice(0);   // Make a copy to check against.
            expect(previous_events).to.eql([]);
        });

        var my_event = {command: 'add event', name: 'event name', data: {}};

        it('should allow adding events', function(){
            expect(deq.push.bind(deq,my_event)).not.to.throw(Error);
            expect(deq).have.property('events')
                .that.has.lengthOf(1)
                // .and.that.has.deep.property('[0][0]',my_event.name);
        });

        it('should then hold only the just added event', function(){
            expect(deq.events[0][0]).to.equal(my_event.name);
            expect(deq.events[0][1]).to.have.all.keys(['event', 'event_timestamp_deq']);
            expect(deq.events[0][1]).to.have.property('event', my_event.name);
            expect(deq.events[0][1]).to.have.property('event_timestamp_deq');
        });
    });

    context('Listen to named events', function(){
        before(function(){
            window.deq = DEQFactory.get(generateDEQName());
            window.test_check = [];
            window.test_callback = void 0;
        });

        after(function(){
            // delete window.deq;
            delete window.test_check;
            delete window.test_callback;
        });


        it('should have no registered listeners when this test starts', function(){
            var previous_listeners = window.deq.listeners.slice(0);   // Make a copy to check against.
            expect(previous_listeners).to.eql([]);
        });

        var my_command = {
            command: 'add listener',
            name: 'my listener',
            handler: function(name,data){
                console.log('callback called');
                expect(name).to.equal('my test event');
                expect(data).to.be.an('object');
                expect(data).to.have.keys(['event', 'event_timestamp_deq', 'callback']);
                expect(data).to.have.property('callback').that.is.a('string');
                window.test_check.push([name,data]);
                window[data.callback]();
            },
            matchEvent: 'my test event'};

        it('should allow adding listener', function(){
            expect(deq.push.bind(deq,my_command)).not.to.throw(Error);
            expect(deq).have.property('listeners')
                .that.is.length(1)
                // .and.that.has.deep.property('[0][0]',my_command.name);
        });

        it('should then hold only the just added listener', function(){
            expect(deq.listeners[0][0]).to.equal(my_command.name);
        });

        it('should respond to the event', function(done){
            window.test_callback = done;
            var my_event_command = {command: 'add event', name: 'my test event', data: {'callback': 'test_callback'}};
            deq.push(my_event_command);
            expect(deq.events).to.have.lengthOf(1);
            if (deq.events.length > 1) done();
            // Else, the done should be called by the callback function.
        });

        // it('should not respond to a different event');

        it('should, on registering a new listener, also receive events fired in the past when the skipHistory parameter is set to false', function(done){
            var my_new_command = {
                command: 'add listener',
                name: 'my second listener',
                handler: function(name,data){
                    console.log('callback called');
                    expect(name).to.equal('my test event');
                    expect(data).to.be.an('object');
                    expect(data).to.have.keys(['event', 'event_timestamp_deq', 'callback']);
                    expect(data).to.have.property('callback').that.is.a('string');
                    window.test_check.push([name,data]);
                    window[data.callback]();
                },
                matchEvent: 'my test event',
                skipHistory: false
            };

            window.test_callback = done;
            expect(deq.push.bind(deq,my_new_command)).not.to.throw(Error);
            expect(deq).have.property('listeners')
                .that.is.length(2)
                .and.that.has.deep.property('[1][0]',my_new_command.name);
            // Expect done to be called from within the handler
        });

        var EXPECTED_TIMEOUT = 500;
        it('should not fire for previous events when the skipHistory flag is set true', function(done){
            window.test_callback = '';
            this.timeout(EXPECTED_TIMEOUT + 100); // You add this to make sure mocha test timeout will only happen as a fail-over, when either of the functions haven't called done callback.
            var timeout = setTimeout(done, EXPECTED_TIMEOUT); // This will call done when timeout is reached.
            var callback = function(name,data) {
                clearTimeout(timeout);
                // this should never happen, is the expected behavior.
                done(new Error('Unexpected call'));
            };
            var my_command = {command: 'add listener', name: 'my listeren without history', handler: callback, matchEvent: "my test event", skipHistory: true};
            window.deq.push(my_command);
        });

    });

});
