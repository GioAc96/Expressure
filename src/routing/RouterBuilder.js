const Route = require('./RouteBuilder');

//Class used to build a vanilla express router
class RouterBuilder {

	//Constructor
	constructor( config ) {
		
		//Importing expressure config
		this.config = config;

		//Initializing array of routes
		this.routes = new Array();
		
		//Initializing array of groups of routes
		this.groups = new Array();

		//Initializing array of validators
		this.validators = new Array();

		this._prefix = '';
		this.middlewares = new Array();

	}
	
	//Returns an instance of express vanilla router
	buildRouter( router = null ) {
		
		//Initialize router
		if( router == null ){
		
			router = require('express').Router();

		}

		//Build routes
		this.routes.forEach( route => {

			route.buildRoute( router );

		});

		//Recursively building route groups
		for( const group of this.groups ) {

			group.buildRouter( router );
			
		}

		return router;

	}

	//Creates new route with get method
	get( path, action ) {
	
		return this.route('GET', path, action);

	}
	
	//Creates new route with post method
	post( path, action ) {

		return this.route('POST', path, action);

	}

	route( method, path, action ) {

		//Creating new route
		var route = new Route({
			config: this.config,
			get: method == 'GET',
			post: method == 'POST',
			path: path,
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
	
	//Add prefix to all routes
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


		return this;

	}

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

	//Create new route group
	group( callback ) {

		//Creating group
		var group = new RouterBuilder( this.config );
		callback(group);

		//Adding this' middlewares to group
		for (const middleware of this.middlewares) {
			
			group.middleware(middleware);

		}

		//Adding this' validators to group
		for ( const validator of this.validators ) {

			group.validate( validator );

		}

		//Passing prefix to group
		group.prefix( this._prefix );

		//Adding group to this' groups array
		this.groups.push(group);

		return group;

	}

	//Add validator to all rotues
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

		return this;

	}

}

module.exports = ( config ) => {
	return new RouterBuilder( config );
}