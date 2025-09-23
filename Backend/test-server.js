// Simple test to see if Node.js can run in this directory
console.log('Node.js is working in this directory');
console.log('Current working directory:', process.cwd());
console.log('__dirname equivalent:', import.meta.url);

// Test if we can import the main modules
try {
    const { default: dotenv } = await import('dotenv');
    console.log('✓ dotenv imported successfully');
    
    dotenv.config({ path: './.env' });
    console.log('✓ .env loaded');
    
    const { default: connectDB } = await import('./src/Config/db.js');
    console.log('✓ db config imported');
    
    const { default: app } = await import('./src/Config/app.js');
    console.log('✓ app config imported');
    
    console.log('All imports successful - server should be able to start');
    
} catch (error) {
    console.error('Error during import:', error.message);
    console.error('Stack:', error.stack);
}