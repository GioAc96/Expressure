module.exports = ( expressureConfig ) => {

	global.expressureConfig = expressureConfig;

	const requireFile = ( pathName, fileName ) => {

		return require(
			global.expressureConfig.appPath +
			global.expressureConfig.paths[ pathName ] +
			'/' +
			fileName
		);

	};
	
	global.expressure = {

		/**
		 * Generates a new Expressure RouterBuilder
		 */
		Router() {
			
			const routerClass = require('./src/routing/RouterBuilder');
			return new routerClass( global.expressureConfig );

		},

		/**
		 * Builds all routers
		 * @param { Express app } app the Express app to build routes on
		 */
		buildRouters( app ) {

			//Get router builders directories
			const routesDir = global.expressureConfig.appPath + global.expressureConfig.paths.routes;
			const routeFiles = global.expressureConfig.routes;

			Object.entries( routeFiles ).forEach( ([i, routeFile]) => {

				console.log("\nBuilding Router: \x1b[32m%s\x1b[0m\n", routeFile);

				//Calling route files (RouterBuilders)
				const routerBuilder = require(routesDir + "/" + routeFile);

				//Adding routers to app
				app.use( routerBuilder.buildRouter() );

			});

		},

		/**
		 * Helpers
		 */
		helpers: {

			/**
			 * Response helper
			 */
			response: require('./src/helpers/response'),

			/**
			 * File helper
			 */
			file: requireFile

		},

		/**
		 * Validator
		 */
		validator: require('./src/helpers/Validator'),

		/**
		 * File helper shortcut
		 */
		require: requireFile,

	}

	return global.expressure;

}