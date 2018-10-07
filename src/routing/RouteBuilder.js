//Class used to build single routes
class RouteBuilder {

	//Constructor
	constructor({

		//Expressure configuration
		config,

		//The path (uri) of the route
		path,

		//Action associated to the route
		action,

		//Methods allowed
		get = false,
		post = false,
		
		
	} = {}) {
		
		this.config = config;
	
		this.path = path;
		
		action = action.split('@');
		this.controllerName = action[0];
		this.controllerMethod = action[1];

		this.get = get;
		this.post = post;
		this.middlewares = new Array();

	}

	//Add current route to vanilla express router
	buildRoute( router ) {

		//Retrieve route action callback
		var controllersPath = this.config.appPath + this.config.paths.controllers;
		var callback = require(controllersPath + '/' + this.controllerName)[this.controllerMethod];

		var fn;

		//Retrieve method
		if( this.get ){
			
			fn = router.get;

		} else if( this.post ){

			fn = router.post;

		}

		//Building arguments array
		var args = this.middlewares;
		args.push(callback);
		args.unshift(0);

		//Applying prefix
		args[0] = this._prefix + this.path;

		//Creating route on vanilla router
		fn.apply(router, args)

	}

	//Add middleware to current route
	middleware( middlewareName ) {
		
		//Retrieving middleware
		const middlewaresPath = this.config.appPath + this.config.paths.middlewares;
		const middleware = require(middlewaresPath + '/' + middlewareName);

		//Add middleware to middlewares array
		this.middlewares.push( middleware );
		return this;

	}

	//Specify route name
	name( name ) {

		this.name = name;
		return this;

	}

	//Add prefix to route
	prefix( prefix ) {
		this._prefix = prefix;
	}

}

module.exports = RouteBuilder;