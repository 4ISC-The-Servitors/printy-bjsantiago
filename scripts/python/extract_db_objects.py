import json
import re
import os

# Read the functions file
with open(r'c:\Users\anden\.cursor\projects\c-Users-anden-OneDrive-Documents-GitHub-printy-bjsantiago\agent-tools\d29bc38c-22dc-4642-8731-6828a0c686f8.txt', 'r', encoding='utf-8') as f:
    raw_content = f.read()

# The file content is a JSON-encoded string, so decode it first
content = json.loads(raw_content)

# Now extract the JSON array from the decoded content
# Look for the array pattern in the decoded string
match = re.search(r'\[.*\]', content, re.DOTALL)
if match:
    json_str = match.group()
    functions_data = json.loads(json_str)
    
    # Create functions directory if it doesn't exist
    functions_dir = 'supabase/functions'
    os.makedirs(functions_dir, exist_ok=True)
    
    # Write each function to a file
    func_count = 0
    seen_functions = {}  # Track functions by name+args to handle overloads
    
    for func in functions_data:
        func_name = func['function_name']
        func_def = func['function_definition']
        args = func.get('arguments', '')
        
        # Create unique key for overloaded functions
        func_key = f"{func_name}({args})"
        
        # For overloaded functions, include args in filename
        if func_key in seen_functions:
            # This is an overload, create a filename with args hash
            args_hash = str(hash(args))[-8:]
            filename = f"{func_name}_{args_hash}.sql"
        else:
            filename = f"{func_name}.sql"
        
        seen_functions[func_key] = filename
        filepath = os.path.join(functions_dir, filename)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(func_def)
        func_count += 1
    
    print(f"Created {func_count} function files in {functions_dir}")
else:
    print("Could not find JSON array in content")
