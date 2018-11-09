/**
 * Class used to create Rotues
 */
class RouteBuilder {

	constructor({
		
		//Methods allowed
		method,

		//The uri of the route
		uri,

		//Action associated to the route
		action,

	} = {}){
		
		//Checking wether Expressure config was set
		if( global.expressureConfig === undefined ){
			throw new Error("Expressure must be initialized before instantiating a new RouteBuilder");
		}
	
		this.uri = uri;
		this.method = method;
		
		action = action.split('@');
		this.controllerName = action[0];
		this.controllerMethod = action[1];

		this.middlewares = new Array();
		this.validators = new Array();
		this.policies = new Array();
		this.binders = new Array();

		this._prefix = '';

	}
	
	/**
	 * Adds a middleware to the rotue
	 * @param {String} middlewareName Name of the middleware to add to the route
	 */
	middleware( middlewareName ){

		//Add middleware to middlewares array
		this.middlewares.push(
			global.expressure.require( 'middlewares', middlewareName )
		);
		
		//Returning this for method chaining
		return this;

	}

	/**
	 * Assignsa name to the route
	 * @param {String} name Name of the route
	 */
	name( name ){

		this._name = name;

		//Returning this for method chaining
		return this;

	}

	/**
	 * Adds a prefix to the route URI
	 * @param {String} prefix Prefix to add to the route URI
	 */
	prefix( prefix ){

		this._prefix = prefix + this._prefix;
		
		//Returning this for method chaining
		return this;

	}
	
	/**
	 * Adds a validator to the route
	 * @param {String} validator Name of the validator to add to the route
	 */
	validate( validator ){

		this.validators.push( validator )

		//Returning this for method chaining
		return this;

	}

	/**
	 * Enforces a policy for the route
	 * @param {String} policyName Name of the policy
	 * @param {String} policyMethod Name of the method of the policty
	 */
	policy( policyName, policyMethod ){

		this.policies.push({
		
			policyName: policyName,
			policyMethod: policyMethod
		
		});

		//Returning this for method chaining
		return this;

	}

	/**
	 * Manually adds a model binder
	 * @param {String} fieldName Name of the field containing the id of the model to bind
	 * @param {String} modelName Name of the model schema to bind
	 */
	bind( fieldName, modelName ){

		//Allowing implicit modelName
		if( modelName === undefined ){
			modelName = fieldName;
		}

		this.binders.push({
			fieldName,
			modelName
		});

		return this;

	}

	/**
	 * Builds a route on the specified Express Router
	 * @param {Express Router} router Router to which build the route on
	 * @param {String[]} parentRouterNames Array of names of routers
	 */
	buildRoute( router, parentRouterNames = [] ){

		this.parentRouterNames = parentRouterNames;

		//Logging route name
		this.buildingLog()

		//Retrieving Express router method
		const expressRouteBuilder = router[ this.method.toLowerCase() ];

		//Calculating full uri
		this.fullUri = this._prefix + this.uri;
		
		//Building arguments array for expressRouteBuilder
		const expressRouteBuilderArgs = [
			
			//Route URI
			this.fullUri.split('::').join(':'),
			
			...this.buildRequestPipeline()

		];
		
		//Creating route on vanilla router
		expressRouteBuilder.apply(router, expressRouteBuilderArgs)

	}

	/**
	 * Logs to console the building of the route
	 */
	buildingLog(){

		//Checking wether the route is named
		if( this._name === undefined ){

			//Route is unnamed. Using URI
		
			console.log(
				'\x1b[35m%s\x1b[0m: \x1b[33m%s\x1b[0m',
				( this.method.length < 4 ? ( ' '.repeat( 4 - this.method.length ) + this.method) : this.method),
				this.uri
			);
			
		} else {
			
			//The route is named
			
			this.fullName = this.parentRouterNames.join('.') + '.' + this._name;
			
			console.log(
				'\x1b[35m%s\x1b[0m: \x1b[34m%s\x1b[0m',
				( this.method.length < 4 ? ( ' '.repeat( 4 - this.method.length ) + this.method) : this.method),
				this.fullName
			);

		}

	}

	/**
	 * Builds the request pipeline
	 */
	buildRequestPipeline(){

		return [
			
			this.getBootstrapFunction(),
			...this.middlewares,
			...this.buildValidators(),
			...this.buildModelBinders(),
			...this.buildPolicyEnforcers(),
			this.getRequestHandler()

		]

	}

	/**
	 * Returns a request middleware that aggregates request data in req.data
	 */
	getBootstrapFunction(){

			return (req, res, next) => {

				//Initialize service container
				req.providers = {};

				//Initialize model bindings contianer
				req.models = {};

				//Data aggregation
				req.data = { 
					...req.query,
					...req.params,
					...req.body
				}

				next()
			}

	}

	/**
	 * Builds validators of request to Express request handlers
	 */
	buildValidators(){

		const pipeline = new Array();

		for( const validatorName of this.validators){

			const validator = global.expressure.require('validators', validatorName);

			pipeline.push( (req, res, next) => {

				if( validator.validate( req ) ){
					
					//Validation was successful
					return next();

				} else {

					//Validation failed. Sending error response
					return global.expressure.helpers.response.validationError( res, validator.getErrors() );

				}

			});

		}

		return pipeline;

	}

	/**
	 * Builds model binders of request to Express request handlers
	 */
	buildModelBinders(){

		const pipeline = new Array();

		this.resolveImplicitModelBinders();

		for( const binder of this.binders ){

			pipeline.push( async( req, res, next ) => {

				//Checking wether model id is present in request
				if( req.data[ binder.fieldName ] === undefined || req.data[ binder.fieldName ] === null) {
					
					return global.expressure.helpers.response.err(
						res,
						'MODEL_ID_MISSING',
						400,
						undefined,
						{
							modelName: binder.modelName
						}
					);
				
				}

				const modelNotFound = ( res ) => {
				
					return global.expressure.helpers.response.err(
						res,
						'MODEL_NOT_FOUND',
						404,
						undefined,
						{
							modelName: binder.modelName
						}
					);	
				
				}

				try {
					
					//Retrieving model
					const modelSchema = global.expressure.require( 'models', binder.modelName );
					const model = await modelSchema.findById( req.data[ binder.fieldName ] ).exec();
	
					//Checking wether model was found
					if( model === null ){
	
						//Model was not found. Responding with error
						return modelNotFound( res );
	
					} else {
	
						//Binding model
						req.models[ binder.modelName ] = model ;
						return next();
	
					}

				} catch( err ) {

					return modelNotFound( res );

				}

			});

		}

		return pipeline;
	}

	/**
	 * Resolves all implicit model binders specified in the uri of the route
	 */
	resolveImplicitModelBinders(){

		//Looking for implicit model bindings in uri
		for( const routeParam of this.fullUri.split('/') ){
			if( routeParam.startsWith('::') ){
			
				//Adding implicit binding to binders array
				const modelName = routeParam.substring(2);

				this.bind(
					modelName,
					modelName
				)

			}
		}

	}

	/**
	 * Builds policy enforcers of request to Express request handlers
	 */
	buildPolicyEnforcers(){

		const pipeline = new Array();

		const policyEnforcer = this.getPolicyEnforcerFunction();

		//Adding policies to request handlers
		for( const policy of this.policies ){

			pipeline.push( (req, res, next) => {

				//Enforcing policy
				if( policyEnforcer( policy.policyName, policy.policyMethod, req ) ){

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

		return pipeline;
	}

	/**
	 * Returns the request handler
	 */
	getRequestHandler(){
		return global.expressure.require('controllers', this.controllerName)[ this.controllerMethod ];
	}

	/**
	 * Returns the callback used to enforce policies
	 */
	getPolicyEnforcerFunction(){

		return ( policyName, policyMethod, req ) => {

			//Requiring policy
			const policy = global.expressure.require( 'policies', policyName + 'Policy' );
		
			//Enforcing policy on request
			return policy[policyMethod](req);
			
		}

	}

}

module.exports = RouteBuilder;