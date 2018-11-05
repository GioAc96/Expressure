const Route = require('./RouteBuilder');

/**
 * Class used to build express routers
 */
class RouterBuilder {

	/**
	 * Instantiates a new RouteBuilder
	 */
	constructor() {
		
		//Checking wether Expressure config was set
		if( global.expressureConfig == undefined ) {
			throw new Error("Expressure must be initialized before instantiating a new RouteBuilder");
		}

		//Initializing array of routes
		this.routes = new Array();
		
		//Initializing array of groups of routes
		this.groups = new Array();

		//Initializing array of validators
		this.validators = new Array();

		//Initializing prefix
		this._prefix = '';

		//Initializing middlewares array
		this.middlewares = new Array();

		//Initializing policies array
		this.policies = new Array();

		//Initializing group name
		this._name = '';


	}
	
	/**
	 * Builds all routes
	 * @param {Express Router} router Express Router to which the routes should be built on. If null, a new Express Router is instantiated
	 * @param {String[]} parentRouterName Array of names of the parent routers
	 */
	buildRouter( router = null, parentRouterNames = [] ) {
	
		//Initialize router
		if( router == null ){
		
			router = require('express').Router();

		}
		
		//Adding this' name to the router names array
		if( this._name !== '' ) {
			parentRouterNames.push( this._name );
		}

		//Build routes
			
		this.routes.forEach( route => {

			route.buildRoute( router, parentRouterNames );

		});
		

		//Recursively building route groups
		for( const group of this.groups ) {

			group.buildRouter( router, parentRouterNames );
			
		}

		return router;

	}

	/**
	 * Instantiates a new route that accepts requests with the GET method
	 * @param {String} uri Uri of the route
	 * @param {String, Callable} action Controller method used to handle the request
	 */
	get( uri, action ) {
	
		return this.route('GET', uri, action);

	}
	
	/**
	 * Instantiates a new route that accepts requests with the POST method
	 * @param {String} uri Uri of the route
	 * @param {String, Callable} action Controller method used to handle the request
	 */
	post( uri, action ) {

		return this.route('POST', uri, action);

	}

	/**
	 * Instantiates a new route
	 * @param {Array} methods Array of methods accepted by the route
	 * @param {String} uri Uri of the route
	 * @param {String, Callable} action Controller method used to handle the request
	 */
	route( method, uri, action ) {

		//Creating new route
		const route = new Route({
			method: method,
			uri: uri,
			action: action
		});

		//Passing this' middlewares to route
		for (const middleware of this.middlewares) {
			route.middleware(middleware);
		}

		//Passing this' validators to route
		for( const validator of this.validators ) {
			route.validate( validator );
		}

		//Passing this' prefix to route
		route.prefix( this._prefix)

		//Adding route to this' routes array
		this.routes.push(route);

		return route;

	}
	
	/**
	 * Adds a prefix to the URI of all routes in the RouterBuilder
	 * @param {String} prefix prefix to add
	 */
	prefix( prefix ) {

		this._prefix = prefix + this._prefix;

		//Passing prefix to all routes
		for( const routes of this.routes ) {
		
			routes.prefix( prefix );
		
		}

		//Passing prefix to all groups
		for( const group of this.groups ) {

			group.prefix( prefix );

		}
		//Returning this for method chaining
		return this;

	}

	/**
	 * Adds a middelware to all routes
	 * @param {String, Callable} middleware Name of the middleware or middleware callable
	 */
	middleware( middleware ) {

		//Passing middleware to routes
		for ( const route of this.routes ) {
			route.middleware( middleware );
		}

		//Passing middleware to groups
		for ( const group of this.groups ) {
			group.middleware( middleware );
		}

		//Adding middleware to this' middlewares array
		this.middlewares.push( middleware );

		return this;

	}

	/**
	 * Creates a new subgroup of routes
	 * @param {Callback} callback Helper callback that builds routes on the group
	 */
	group( callback ) {

		//Creating group
		var group = new RouterBuilder();
		callback(group);

		//Adding this' middlewares to group
		for (const middleware of this.middlewares) {
			
			group.middleware(middleware);

		}

		//Adding this' validators to group
		for ( const validator of this.validators ) {

			group.validate( validator );

		}

		//Adding this' policies to group
		for ( const policy of this.policies ) {

			group.policy( policy.policyName, policy.policyMethod );

		}

		//Passing prefix to group
		group.prefix( this._prefix );

		//Adding group to this' groups array
		this.groups.push(group);

		return group;

	}

	/**
	 * Adds a validator to all routes
	 * @param {Validator} validator Validator to add
	 */
	validate( validator ) {

		//Passing validator to routes
		for ( const route of this.routes ) {
			route.validate( validator );
		}

		//Passing validator to groups
		for ( const group of this.groups ) {
			group.validate( validator );
		}

		//Adding valiadtor to this' validators array
		this.validators.push( validator );

		//Returning this for method chaining
		return this;

	}

	/**
	 * Adds a policty to all routes
	 * @param {String} policyName Name of the policy
	 * @param {String} policyMethod Name of the method of the policy
	 */
	policy( policyName, policyMethod ) {

		//Passing validator to routes
		for ( const route of this.routes ) {
			route.policy( policyName, policyMethod );
		}

		//Passing validator to groups
		for ( const group of this.groups ) {
			group.policy( policyName, policyMethod );
		}

		//Adding valiadtor to this' validators array
		this.policies.push( { policyName, policyMethod } );

		//Returning this for method chaining
		return this;

	}

	/**
	 * Sets the name of the current router
	 * @param {String} name Name of the router/route group
	 */
	name( name ) {
		this._name = name;
	}

}

module.exports = RouterBuilder;