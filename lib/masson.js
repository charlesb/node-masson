
// Class - Masson - Copyright David Worms <open@adaltas.com> (MIT Licensed)

var EventEmitter = require('events').EventEmitter;

var Masson = function(c,target,args){
	/*
		Stack elements are structured as
			target name or callback function
			context object in case of a callback
			arguments
	*/
	var conf = {},
		stack = [],
		self = this,
		called = {};
	if(c instanceof Array){
		c.forEach(function(el){
			conf[ el.target || el.name ] = 
				[ el.depends || el.in || null
				, el.callback || el.out
				];
		});
	}else{
		for(var k in c){
			conf[k] = [null,c[k]];
		}
	}
	delete c;
	var Context = function(target){
		this.target = target;
	}
	Context.prototype.in = function(/*target,params,callback...*/){
		var args = Array.prototype.slice.call(arguments),
			targets, params, callback;
		if(args.length===1){
			targets = args.shift();
			params = [];
			callback = null;
		}else if(args.length===2){
			targets = args.shift();
			params = [];
			callback = args.shift();
		}else if(args.length===3){
			targets = args.shift();
			params = args.shift();
			callback = args.shift();
		}
		if(typeof targets == 'string'){
			targets = [targets];
		}
		if(callback){
			stack.unshift([callback,this,[null].concat(params)]);
		}
		targets.reverse().forEach(function(target){
			stack.unshift([target,null,params]);
		});
		run(this);
	}
	Context.prototype.out = function(){
		var args = Array.prototype.slice.call(arguments);
		for(var i=0;i<stack.length;i++){
			if(typeof stack[i][0] == 'function'){
				stack[i][2].push(args);
				break;
			}
		}
		self.emit('after',this,args);
		run(this);
	}
	var run = function(parentContext){
		if(!stack.length){
			return;
		}
		var el = stack.shift();
		var callback = el[0],
			context = el[1],
			args = el[2];
		if(typeof callback == 'string'){
			var target = callback;
			var targetConf = conf[target];
			if(!targetConf){
				// find a callback and send it error
				while(typeof stack[0][0] == 'string'){
					stack.shift();
				}
				self.emit('error',parentContext);
				stack[0][2] = [new Error('Invalid target: '+target)];
				return run();
			}
			context = new Context(callback);
			if(targetConf[0]){
				var context = new Context(target);
				return context.in(targetConf[0],targetConf[1]);
			}
			callback = targetConf[1];
		}
		if(!called[context.target]){
			self.emit('before',context);
		}
		called[context.target] = true;
		callback.apply(context,args);
	}

	this.run = function(target,args){
		process.nextTick(function(){
			(new Context()).in(target,args||[],null);
		});
		return this;
	};
	
	this.task = function(){
		var args = Array.prototype.slice.call(arguments);
		var target = args.shift();
		var depends = args.length && (typeof args[0] == 'string' || args[0] instanceof Array)
			? args.shift()
			: null;
		var callback = args.shift();
		conf[target] = [depends,callback];
		return this;
	}
	
	if(target){
		this.run(target,args);
	}
}

Masson.prototype.__proto__ = EventEmitter.prototype;

module.exports = function(configuration,target,args){
	return new Masson(configuration,target,args);
}