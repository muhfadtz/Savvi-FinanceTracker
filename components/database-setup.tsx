"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Database, CheckCircle, AlertCircle, Copy, ExternalLink, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase"

interface DatabaseSetupProps {
  onSetupComplete: () => void
}

export function DatabaseSetup({ onSetupComplete }: DatabaseSetupProps) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const supabase = createClient()

  const sqlScript = `-- Enable Row Level Security

-- Create money_buckets table
CREATE TABLE IF NOT EXISTS money_buckets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    balance DECIMAL(12, 2) DEFAULT 0.00,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    amount DECIMAL(12, 2) NOT NULL,
    type VARCHAR(10) CHECK (type IN ('income', 'expense')) NOT NULL,
    category VARCHAR(255) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    bucket_id UUID REFERENCES money_buckets(id) ON DELETE CASCADE,
    goal_allocation DECIMAL(12, 2),
    goal_id UUID,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create goals table
CREATE TABLE IF NOT EXISTS goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    target_amount DECIMAL(12, 2) NOT NULL,
    current_amount DECIMAL(12, 2) DEFAULT 0.00,
    completed BOOLEAN DEFAULT FALSE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create debts table
CREATE TABLE IF NOT EXISTS debts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    amount DECIMAL(12, 2) NOT NULL,
    person_name VARCHAR(255) NOT NULL,
    due_date DATE,
    type VARCHAR(20) CHECK (type IN ('owed_by_me', 'owed_to_me')) NOT NULL,
    paid BOOLEAN DEFAULT FALSE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint for goals in transactions
ALTER TABLE transactions 
ADD CONSTRAINT fk_transactions_goals 
FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE SET NULL;

-- Enable Row Level Security
ALTER TABLE money_buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can only see their own money buckets" ON money_buckets
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only see their own transactions" ON transactions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only see their own goals" ON goals
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only see their own debts" ON debts
    FOR ALL USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_money_buckets_user_id ON money_buckets(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_bucket_id ON transactions(bucket_id);
CREATE INDEX IF NOT EXISTS idx_transactions_goal_id ON transactions(goal_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_debts_user_id ON debts(user_id);
CREATE INDEX IF NOT EXISTS idx_debts_type ON debts(type);
CREATE INDEX IF NOT EXISTS idx_debts_paid ON debts(paid);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_money_buckets_updated_at BEFORE UPDATE ON money_buckets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_debts_updated_at BEFORE UPDATE ON debts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();`

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(sqlScript)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const testConnection = async () => {
    setLoading(true)
    setError(null)

    try {
      // Test if tables exist now
      const { data, error } = await supabase.from("money_buckets").select("id").limit(1)

      if (error) {
        if (error.message.includes("does not exist")) {
          setError("Tables not found. Please run the SQL script first.")
        } else {
          throw error
        }
      } else {
        // Success! Tables exist
        onSetupComplete()
      }
    } catch (err: any) {
      setError(err.message || "Connection test failed")
    } finally {
      setLoading(false)
    }
  }

  const openSupabaseDashboard = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (supabaseUrl) {
      const projectRef = supabaseUrl.split("//")[1].split(".")[0]
      window.open(`https://supabase.com/dashboard/project/${projectRef}/sql`, "_blank")
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-[#191414]">
      <Card className="w-full max-w-2xl bg-[#121212] border-[#535353]">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-[#1DB954] rounded-full flex items-center justify-center mx-auto mb-4">
            <Database className="h-8 w-8 text-black" />
          </div>
          <CardTitle className="text-2xl text-white">Database Setup Required</CardTitle>
          <p className="text-[#B3B3B3]">Your database tables need to be created before you can use savviFinance.</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Instructions */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-[#1DB954] rounded-full flex items-center justify-center text-black font-bold">
                1
              </div>
              <h3 className="text-lg font-semibold text-white">Copy the SQL Script</h3>
            </div>
            <div className="bg-[#191414] rounded-lg p-4 border border-[#535353]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[#B3B3B3]">SQL Script</span>
                <Button
                  onClick={copyToClipboard}
                  size="sm"
                  variant="outline"
                  className="border-[#535353] text-[#B3B3B3] hover:text-white bg-transparent"
                >
                  {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>
              <div className="bg-black rounded p-3 max-h-40 overflow-y-auto">
                <pre className="text-xs text-[#B3B3B3] whitespace-pre-wrap">{sqlScript}</pre>
              </div>
            </div>
          </div>

          {/* Step 2: Run in Supabase */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-[#1DB954] rounded-full flex items-center justify-center text-black font-bold">
                2
              </div>
              <h3 className="text-lg font-semibold text-white">Run in Supabase Dashboard</h3>
            </div>
            <div className="space-y-3">
              <p className="text-[#B3B3B3] text-sm">
                1. Open your Supabase project dashboard
                <br />
                2. Go to <strong>SQL Editor</strong>
                <br />
                3. Paste the copied script
                <br />
                4. Click <strong>Run</strong>
              </p>
              <Button
                onClick={openSupabaseDashboard}
                variant="outline"
                className="w-full border-[#535353] text-[#B3B3B3] hover:text-white bg-transparent"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Supabase SQL Editor
              </Button>
            </div>
          </div>

          {/* Step 3: Test Connection */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-[#1DB954] rounded-full flex items-center justify-center text-black font-bold">
                3
              </div>
              <h3 className="text-lg font-semibold text-white">Test Connection</h3>
            </div>
            <div className="space-y-3">
              <p className="text-[#B3B3B3] text-sm">
                After running the SQL script, click the button below to test if everything is working.
              </p>
              <Button
                onClick={testConnection}
                disabled={loading}
                className="w-full bg-[#1DB954] hover:bg-[#1ed760] text-black"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Testing Connection...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Database className="h-4 w-4" />
                    <span>Test Database Connection</span>
                  </div>
                )}
              </Button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div className="flex items-center space-x-2 text-red-400">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          {/* Help Text */}
          <div className="p-4 bg-[#191414] border border-[#535353] rounded-lg">
            <p className="text-xs text-[#535353] text-center">
              Need help? Make sure your Supabase project is active and you have the correct environment variables set.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
