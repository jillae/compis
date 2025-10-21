-- Create the missing booked_customers table
CREATE TABLE IF NOT EXISTS public.booked_customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    service_id UUID REFERENCES public.services(id),
    booking_date TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'confirmed',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.booked_customers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view booked customers from their clinic"
    ON public.booked_customers
    FOR SELECT
    USING (clinic_id IN (
        SELECT clinic_id 
        FROM public.profiles 
        WHERE id = auth.uid()
    ));

CREATE POLICY "Users can create booked customers for their clinic"
    ON public.booked_customers
    FOR INSERT
    WITH CHECK (clinic_id IN (
        SELECT clinic_id 
        FROM public.profiles 
        WHERE id = auth.uid()
    ));

CREATE POLICY "Users can update booked customers from their clinic"
    ON public.booked_customers
    FOR UPDATE
    USING (clinic_id IN (
        SELECT clinic_id 
        FROM public.profiles 
        WHERE id = auth.uid()
    ));

CREATE POLICY "Users can delete booked customers from their clinic"
    ON public.booked_customers
    FOR DELETE
    USING (clinic_id IN (
        SELECT clinic_id 
        FROM public.profiles 
        WHERE id = auth.uid()
    ));

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_booked_customers_updated_at 
    BEFORE UPDATE ON public.booked_customers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();