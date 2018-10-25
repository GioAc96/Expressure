//This file contains the general configuration of the application

module.exports = {

	//Absolute path to app directory
	appPath: "/path/to/app",

	//Paths relative to the app directory
	paths: {

		controllers: "/app/http/controllers",
		routes: "/app/routes",
		middlewares: "/app/http/middlewares",
		errors: '/app/config/errors',
		validators: '/app/http/validators',
		policies: '/app/policies'

	},

	//List of route files in routes path
	routes: [
		"web"
	]
	
}