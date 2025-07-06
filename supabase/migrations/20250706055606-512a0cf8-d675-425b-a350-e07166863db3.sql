
-- Create profiles table linked to auth.users
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT,
  email TEXT,
  token_usage INTEGER NOT NULL DEFAULT 0,
  subscription_tier TEXT NOT NULL DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create preseeded_adventures table for template adventures
CREATE TABLE public.preseeded_adventures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  starter_message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create adventures table for user adventures
CREATE TABLE public.adventures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  preseeded_adventure_id UUID REFERENCES public.preseeded_adventures(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create messages table for full conversation history
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  adventure_id UUID REFERENCES public.adventures(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'ai')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create token_usage_logs table for tracking API usage
CREATE TABLE public.token_usage_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  adventure_id UUID REFERENCES public.adventures(id) ON DELETE CASCADE,
  tokens_used INTEGER NOT NULL,
  model_used TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adventures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preseeded_adventures ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- RLS Policies for adventures
CREATE POLICY "Users can view their own adventures" 
  ON public.adventures 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own adventures" 
  ON public.adventures 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own adventures" 
  ON public.adventures 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own adventures" 
  ON public.adventures 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- RLS Policies for messages
CREATE POLICY "Users can view messages from their adventures" 
  ON public.messages 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.adventures 
      WHERE adventures.id = messages.adventure_id 
      AND adventures.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in their adventures" 
  ON public.messages 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.adventures 
      WHERE adventures.id = messages.adventure_id 
      AND adventures.user_id = auth.uid()
    )
  );

-- RLS Policies for token_usage_logs
CREATE POLICY "Users can view their own token usage" 
  ON public.token_usage_logs 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own token usage logs" 
  ON public.token_usage_logs 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for preseeded_adventures (public read access)
CREATE POLICY "Anyone can view preseeded adventures" 
  ON public.preseeded_adventures 
  FOR SELECT 
  TO authenticated
  USING (true);

-- Create trigger function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- Create trigger to automatically create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
