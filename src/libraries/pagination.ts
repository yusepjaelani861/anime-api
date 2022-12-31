const pagination = (page: number, limit: number, total: number) => {
    const total_pages = Math.ceil(total / limit) || 1;
    const current_page = page || 1;
    const per_page = limit || 10;
    const prev_page = current_page > 1 ? current_page - 1 : null;
    const next_page = current_page < total_pages ? current_page + 1 : null;
    const from = (current_page - 1) * per_page + 1;
    const to = current_page * per_page > total ? total : current_page * per_page;

    return {
        total,
        total_pages,
        current_page,
        per_page,
        prev_page,
        next_page,
        from,
        to,
    }
}

export default pagination