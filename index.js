var fs = require('fs');

var middleware;

function proccessMiddleware(plugins) {
	var orderedMiddleware = [],
		availableDependencies = {},
		totalPlugins = plugins.length,
		numPlugins = 0;

	function addPlugin(plugin) {
		var middleware = plugin.middleware;
		if(Array.isArray(middleware)) {
			orderedMiddleware = orderedMiddleware.concat(middleware);
		} else if(typeof middleware === 'function') {
			orderedMiddleware.push(middleware);
		} else {
			throw new TypeError('middleware must be a middleware function or array of functions');
		}
		numPlugins++;
		plugin.added = true;
		availableDependencies[plugin.name] = true;
	}

	function hasFulfilledDependencies(plugin) {
		var dependencies = plugin.dependencies;
		if(!dependencies) {
			return true;
		}
		if(!Array.isArray(dependencies)) {
			throw new TypeError('dependencies must be an array of plugin names');
		}
		return dependencies.every(function(dep) {
			var depStatus = availableDependencies[dep];
			if(typeof depStatus === 'undefined') {
				throw new Error(plugin.name + ' dependency \'' + dep + '\' does not exist.');
			}
			return !!availableDependencies[dep];
		});
	}

	plugins.forEach(function createPluginDictionary(plugin) {
		availableDependencies[plugin.name] = false;
	});

	plugins.forEach(function addSetup(plugin) {
		if(plugin.name === 'setup') {
			if(typeof plugin.dependencies !== 'undefined') {
				throw new Error('setup plugin cannot have dependencies.');
			}
			addPlugin(plugin);
		}
	});

	plugins.forEach(function addPriority(plugin) {
		if(!plugin.added && plugin.priority) {
			addPlugin(plugin);
		}
	});

	while(numPlugins < totalPlugins) {
		plugins.forEach(function addNormal(plugin) {
			if(!plugin.added && hasFulfilledDependencies(plugin)) {
				addPlugin(plugin);
			}
		});
	}

	return orderedMiddleware;
}

module.exports = {
	init: function init(params) {
		var middlewareDirectory = './examples';
		var middlewareFiles = fs.readdirSync(middlewareDirectory);
		var middlewareModules = middlewareFiles.map(function(filename) {
			return require(middlewareDirectory + '/' + filename);
		});
		console.log(middlewareModules);
		var orderedMiddleware = proccessMiddleware(middlewareModules);
		console.log(orderedMiddleware);
		return;
		// proccessMiddleware(directory);
	}
};

module.exports.init();