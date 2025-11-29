import os
import re

files = [
    "services/gallery-service.ts",
    "services/basket-service.ts",
    "services/purchase-service.ts",
    "services/auth-rate-limiting.ts",
    "services/user-service.ts",
    "lib/auth.ts",
    "lib/user-validation.ts",
    "lib/auth-utils.ts",
    "app/page.tsx",
    "app/events/page.tsx",
    "app/events/[id]/page.tsx",
    "app/notices/page.tsx",
    "app/events/[id]/edit/page.tsx",
    "app/checkout/complete/page.tsx",
    "app/api/logs/route.ts",
    "app/(layout)/docs/api/actions.ts",
    "app/api/user/[userId]/route.ts",
    "app/api/user/changeUserId/[userId]/route.ts",
    "app/notices/[id]/page.tsx",
    "app/checkout/cancel/page.tsx",
    "app/notices/[id]/edit/page.tsx",
    "app/api/admin/users/vrp-discord-ids/route.ts",
    "app/admin/users/page.tsx",
    "app/api/admin/users/user-ids/route.ts",
    "app/api/admin/images/delete/route.ts",
    "app/api/admin/users/make-admin/route.ts",
    "app/api/admin/users/delete/route.ts",
    "app/api/admin/users/remove-admin/route.ts",
    "app/purchases/page.tsx",
    "actions/payment-actions.ts",
    "actions/notice-actions.ts",
    "actions/basket-action.ts",
    "actions/discord-action.ts",
    "actions/event-actions.ts",
    "actions/sync-action.ts",
    "actions/user-action.ts"
]

base_path = "/Users/voidique/folders/shiba-userboard/"

for file_path in files:
    full_path = os.path.join(base_path, file_path)
    if not os.path.exists(full_path):
        print(f"Skipping {file_path} (not found)")
        continue

    with open(full_path, "r") as f:
        content = f.read()

    # Regex to find import { ... } from "@/lib/schema"
    # We want to capture the content inside { }
    pattern = r'import\s+\{([^}]+)\}\s+from\s+"@/lib/schema";?'
    
    def replace_import(match):
        imports = match.group(1)
        items = [item.strip() for item in imports.split(",")]
        items = [i for i in items if i] # remove empty strings
        
        if "db" in items:
            items.remove("db")
            new_schema_import = ""
            if items:
                new_schema_import = f'import {{ {", ".join(items)} }} from "@/lib/schema";\n'
            
            return f'{new_schema_import}import {{ db }} from "@/lib/db";'
        
        return match.group(0)

    new_content = re.sub(pattern, replace_import, content)

    if new_content != content:
        print(f"Updating {file_path}")
        with open(full_path, "w") as f:
            f.write(new_content)
