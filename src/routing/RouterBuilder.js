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
	
		//Creating new route
		var route = new Route({
			config: this.config,
			get: true,
			path: path,
			action: action
		});

		//Passing this' middlewares to route
		for (const middleware of this.middlewares) {
			route.middleware(middleware);
		}

		//Passing this' prefix to route
		route.prefix( this._prefix)

		//Adding route to this' routes array
		this.routes.push(route);

		return route;

	}
	
	//Creates new route with post method
	post( path, action ) {

		//Creating new route
		var route = new Route({
			config: this.config,
			post: true,
			path: path,
			action: action
		});

		//Passing this' middlewares to route
		for (const middleware of this.middlewares) {
			route.middleware(middleware);
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

		//Adding this' middleware to group
		for (const middleware of this.middlewares) {
			group.middleware(middleware);
		}

		//Passing prefix to group
		group.prefix( this._prefix );

		//Adding group to this' groups array
		this.groups.push(group);

		return group;

	}

}

module.exports = ( config ) => {
	return new RouterBuilder( config );
}