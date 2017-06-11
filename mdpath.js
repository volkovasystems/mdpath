/*;
	@module-license:
		The MIT License (MIT)
		@mit-license

		Copyright (@c) 2017 Richeve Siodina Bebedor
		@email: richeve.bebedor@gmail.com

		Permission is hereby granted, free of charge, to any person obtaining a copy
		of this software and associated documentation files (the "Software"), to deal
		in the Software without restriction, including without limitation the rights
		to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
		copies of the Software, and to permit persons to whom the Software is
		furnished to do so, subject to the following conditions:

		The above copyright notice and this permission notice shall be included in all
		copies or substantial portions of the Software.

		THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
		IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
		FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
		AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
		LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
		OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
		SOFTWARE.
	@end-module-license

	@module-configuration:
		{
			"package": "mdpath",
			"path": "mdpath/mdpath.js",
			"file": "mdpath.js",
			"module": "mdpath",
			"author": "Richeve S. Bebedor",
			"eMail": "richeve.bebedor@gmail.com",
			"repository": "https://github.com/volkovasystems/mdpath.git",
			"test": "mdpath-test.js",
			"global": true
		}
	@end-module-configuration

	@module-documentation:
		Get list of mongo database directory path.
	@end-module-documentation

	@include:
		{
			"comex": "comex",
			"depher": "depher",
			"filled": "filled",
			"mdcon": "mdcon",
			"mdngine": "mdngine",
			"parsfy": "parsfy",
			"path": "path",
			"raze": "raze",
			"truu": "truu",
			"zelf": "zelf"
		}
	@end-include
*/

const comex = require( "comex" );
const depher = require( "depher" );
const filled = require( "filled" );
const mdcon = require( "mdcon" );
const mdngine = require( "mdngine" );
const parsfy = require( "parsfy" );
const path = require( "path" );
const raze = require( "raze" );
const truu = require( "truu" );
const zelf = require( "zelf" );

const mdpath = function mdpath( synchronous, option ){
	/*;
		@meta-configuration:
			{
				"synchronous": "boolean",
				"option": "object"
			}
		@end-meta-configuration
	*/

	let parameter = raze( arguments );

	synchronous = depher( parameter, BOOLEAN, false );

	option = depher( parameter, OBJECT, { } );

	let command = comex( "@mongo-path --port @port @host --quiet" )
		.join( `--eval 'db.getSiblingDB( "admin" ).runCommand( { "getCmdLineOpts": 1 } )'` )
		.format( ( result ) => parsfy( result ) );

	if( synchronous ){
		try{
			let binaryPath = mdngine( true, option );

			return mdcon( true, option )
				.map( ( connection ) => {
					let connectCommand = command.clone( )
						.replace( "mongo-path", path.resolve( binaryPath, "mongo" ) )
						.replace( "port", connection.port );

					if( connection.host == "0.0.0.0" ){
						connectCommand.replace( "host", "" );

					}else{
						connectCommand.replace( "host", `--host ${ connection.host }` );
					}

					let result = connectCommand.execute( true, option );

					if( truu( result ) ){
						connection.path = result.parsed.storage.dbPath;
					}

					return connection;
				} );

		}catch( error ){
			throw new Error( `cannot get list of mongo database directory path, ${ error.stack }` );
		}

	}else{
		let catcher = mdngine.bind( zelf( this ) )( option )
			.then( function done( error, binaryPath ){
				if( error instanceof Error ){
					return catcher.pass( new Error( `cannot get list of mongo database directory path, ${ error.stack }` ), [ ] );

				}else{
					return catcher.through( "get-connection", null, binaryPath );
				}
			} )
			.flow( "get-connection", function getConnection( error, binaryPath ){
				return mdcon( option )( function done( error, connection ){
					if( error instanceof Error ){
						return catcher.pass( new Error( `cannot get list of mongo database directory path, ${ error.stack }` ), [ ] );

					}else if( filled( connection ) ){
						let connectCommand = connection.map( ( connection ) => {
							let connectCommand = command.clone( )
								.replace( "mongo-path", path.resolve( binaryPath, "mongo" ) )
								.replace( "port", connection.port )
								.set( "connection", connection );

							if( connection.host == "0.0.0.0" ){
								connectCommand.replace( "host", "" );

							}else{
								connectCommand.replace( "host", `--host ${ connection.host }` );
							}

							return connectCommand;
						} );

						return catcher.through( "get-path", null, connectCommand );

					}else{
						return catcher.pass( null, [ ] );
					}
				} );
			} )
			.flow( "get-path", function getPath( error, connectCommand ){
				let pathConnection = [ ];
				let length = connectCommand.length;

				connectCommand.forEach( ( command, index ) => {
					command.execute( option )( function done( error, result ){
						let connection = command.get( "connection" );

						if( error instanceof Error ){
							command.stop( );

							return catcher.pass( new Error( `cannot get list of mongo database directory path, ${ error.stack }` ), [ ] );

						}else if( truu( result ) ){
							connection.path = result.parsed.storage.dbPath;
						}

						pathConnection.push( connection );

						if( pathConnection.length == length ){
							return catcher.pass( null, pathConnection );

						}else{
							return catcher;
						}
					} );
				} );

				return catcher;
			} );

		return catcher;
	}
};

module.exports = mdpath;
