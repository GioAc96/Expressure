class Expressure {

	constructor ( config ) {

		this.config = config;
		this.validator = require('./src/helpers/Validator');

	}

	Router() {
		
		return require('./src/routing/RouterBuilder')(this.config);

	}

	//Automatically call router builders
	buildRouters ( app )  {

		//Get router builders directories
		const routesDir = this.config.appPath + this.config.paths.routes;
		const routeFiles = this.config.routes;

		Object.entries( routeFiles ).forEach( ([i, routeFile]) => {

			//Calling route files (RouterBuilders)
			const routerBuilder = require(routesDir + "/" + routeFiles);

			//Adding routers to app
			app.use( routerBuilder.buildRouter() );
		
		});

	}

	helpers() {

		//Response helpers
		const response = require('./src/helpers/response');
		return {
			response: new response( this.config )
		};

	}

}

module.exports = ( expressureConfig ) => {

	return new Expressure( expressureConfig );

}