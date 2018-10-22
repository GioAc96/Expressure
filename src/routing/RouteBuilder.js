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
		this.validators = new Array();

		this._prefix = '';

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

		//Building arguments array for fn

		const args = [
			
			//Route URI
			this._prefix + this.path,

			//Request data aggregation
			(req, res, next) => {
				req.data = { 
					...req.query,
					...req.params,
					...req.body
				}

				next()
			},

			//Middlewares
			...this.middlewares
		];

		//Adding validators
		const validatorsPath = this.config.appPath + this.config.paths.validators;
		const responseClass = require('../helpers/response');
		const response = new responseClass( this.config );

		//Adding validators to request handlers
		for( const validatorName of this.validators) {

			const validator = require( validatorsPath + '/' + validatorName);

			args.push( (req, res, next) => {

				if( validator.validate( req ) ) {
					
					//Validation was successful
					return next();

				} else {

					//Validation failed. Sending error response
					return response.validationError(res, validator.getErrors() );

				}
				

			});

		}

		args.push(callback);

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

		this._prefix = prefix + this._prefix;
		
		return this;

	}

	//Add validator to all rotues
	validate( validator ) {

		this.validators.push( validator )

	}

}

module.exports = RouteBuilder;