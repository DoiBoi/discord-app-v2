DROP FUNCTION handle_cashout_dummy(bigint[]);
CREATE OR REPLACE FUNCTION handle_cashout_dummy(pending_ids bigint[])
RETURNS TABLE(balance_id bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count int;
BEGIN
    RAISE NOTICE 'pending_ids = %', pending_ids;

    SELECT count(*) INTO v_count FROM public.dummy_rbx_pending WHERE id = ANY(pending_ids);
    RAISE NOTICE 'rows matching pending_ids BEFORE delete = %', v_count;

    RETURN QUERY
    WITH
    deleted_pending AS (
        DELETE FROM public.dummy_rbx_pending p
        WHERE p.id = ANY(pending_ids)
        RETURNING p.queue_id, p.amount
    ),
    aggregated_data AS (
        SELECT dp.queue_id, q.user_id AS b_id, SUM(dp.amount) AS total_deduction
        FROM deleted_pending dp
        JOIN public.dummy_rbx_queue q ON q.id = dp.queue_id
        GROUP BY dp.queue_id, q.user_id
    ),
    updated_queues AS (
        UPDATE public.dummy_rbx_queue q
        SET amount = q.amount - a.total_deduction
        FROM aggregated_data a
        WHERE q.id = a.queue_id
        RETURNING q.id, q.amount
    ),
    deleted_queues AS (
        DELETE FROM public.dummy_rbx_queue
        WHERE id IN (SELECT id FROM updated_queues WHERE amount <= 0)
        RETURNING id
    ),
    updated_balances AS (
        UPDATE public.balances b
        SET balance_rbx = b.balance_rbx - a.total_deduction
        FROM aggregated_data a
        WHERE b.id = a.b_id
        RETURNING b.id
    )
    SELECT DISTINCT ub.id
    FROM updated_balances ub
    LEFT JOIN deleted_queues dq ON TRUE;
END;
$$;
