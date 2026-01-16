DELETE FROM public.orders WHERE is_paid = true AND paid_at IS NULL;
