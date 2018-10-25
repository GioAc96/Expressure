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
		this.policies = new Array();

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
		const path = this._prefix + this.path;

		//Building arguments array for fn


		const args = [
			
			//Route URI
			path.split('::').join(':'),

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

		const modelsPath = this.config.appPath + this.config.paths.models;

		//Parsing route path for model binding
		for( const routeParam of path.split('/') ) {
			
			//Looking for ::
			if( routeParam.startsWith('::') ) {

				
				//:: was found, model should be binded

				//Getting model
				const modelName = routeParam.substring( 2 );
				const modelSchema = require(`${modelsPath}/${modelName}`);
				

				//Adding model binder to request
				args.push( (req, res, next) => {

					//Getting model

					modelSchema.findById( req.params[ modelName ], (err, model) => {
						
						//Checking wether model was found
						if( err ) {

							//Model was not found
							//Responding with error
							return response.err(
								res,
								"MODEL_NOT_FOUND",
								404,
								null,
								modelName
							);	
	
						} else {

							//Model was found
	
							//Checking wether model bindings container was initialized
							if( req.models === undefined ) req.models = {};
	
							req.models[ modelName ] = model ;
							return next();

						}

					});

				});

			}

		}



		//Policy enforcement

		const policyEnforcer = require('../helpers/PolicyEnforcer');

		//Adding policies to request handlers
		for( const policy of this.policies ) {

			args.push( (req, res, next) => {

				//Enforcing policy
				if( policyEnforcer( policy.policyName, policy.policyMethod, req ) ) {

					//Policy check passed. Passing to next handler
					return next();

				} else {

					//Policy check was not passed
					return response.policyError(
						res,
						policy.policyName,
						policy.policyMethod
					);	

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
		
		//Returning this for method chaining
		return this;

	}

	//Specify route name
	name( name ) {

		this.name = name;

		//Returning this for method chaining
		return this;

	}

	//Add prefix to route
	prefix( prefix ) {

		this._prefix = prefix + this._prefix;
		
		//Returning this for method chaining
		return this;

	}

	//Add validator to route
	validate( validator ) {

		this.validators.push( validator )

		//Returning this for method chaining
		return this;

	}

	//Add policy to route
	policy( policyName, policyMethod ) {

		this.policies.push({
		
			policyName: policyName,
			policyMethod: policyMethod
		
		});

		//Returning this for method chaining
		return this;

	}

}

module.exports = RouteBuilder;