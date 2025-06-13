-- Drop existing foreign key constraints if they exist
ALTER TABLE pick_lists
DROP CONSTRAINT IF EXISTS pick_lists_assigned_to_fkey,
DROP CONSTRAINT IF EXISTS pick_lists_created_by_fkey;

-- Add foreign key constraints
ALTER TABLE pick_lists
ADD CONSTRAINT pick_lists_assigned_to_fkey
FOREIGN KEY (assigned_to)
REFERENCES profiles(id)
ON DELETE SET NULL;

ALTER TABLE pick_lists
ADD CONSTRAINT pick_lists_created_by_fkey
FOREIGN KEY (created_by)
REFERENCES profiles(id)
ON DELETE SET NULL;

-- Update RLS policies to use the correct foreign key relationships
DROP POLICY IF EXISTS "Users can view pick lists" ON pick_lists;
DROP POLICY IF EXISTS "Users can create pick lists" ON pick_lists;
DROP POLICY IF EXISTS "Users can update pick lists" ON pick_lists;

CREATE POLICY "Users can view pick lists"
    ON pick_lists FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can create pick lists"
    ON pick_lists FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Users can update pick lists"
    ON pick_lists FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true); 