
const mdpath = require( "./mdpath" );

console.log( mdpath( true ) );

mdpath( )( function done( ){
	console.log( arguments );
} );
