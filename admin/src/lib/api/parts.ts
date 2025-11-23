/* eslint-disable @typescript-eslint/no-explicit-any */

export type AdminPart = {
    id: string;
    part: string;
    level: number;
    test?: number | null;
    order?: number;
    answer: string;
    tags?: string[];
    question?: string;
    stem?: string;
    options?: Record<string, any>;
    stimulusId?: string | null;
    explain?: string | null;
    _id?: string;
};

export type AdminPartsStats = {
    total: number;
    byPart: Array<{ _id: string; count: number }>;
    byLevel: Array<{ _id: number; count: number }>;
    byTest: Array<{ _id: { part: string; test: number }; count: number }>;
};

export type AdminTest = {
    part: string;
    level: number;
    test: number;
    itemCount: number;
    firstItemId: string;
};

export type AdminStimulus = {
    id: string;
    part: string;
    level: number;
    test: number;
    media: {
        image: string | null;
        audio: string;
        script: string;
        explain: string;
    };
};

export async function adminListParts(params?: { page?: number; limit?: number; part?: string; level?: number; test?: number; q?: string }) {
    const usp = new URLSearchParams();
    if (params?.page) usp.set('page', String(params.page));
    if (params?.limit) usp.set('limit', String(params.limit));
    if (params?.part) usp.set('part', params.part);
    if (params?.level) usp.set('level', String(params.level));
    if (params?.test) usp.set('test', String(params.test));
    if (params?.q) usp.set('q', params.q);
    const res = await fetch(`/api/admin/parts?${usp.toString()}`, { credentials: 'include', cache: 'no-store' });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || 'Fetch parts failed'); }
    return res.json() as Promise<{ items: AdminPart[]; total: number; page: number; limit: number; pages: number }>;
}

export async function adminGetPart(mongoId: string) {
    const res = await fetch(`/api/admin/parts/${encodeURIComponent(mongoId)}`, { credentials: 'include', cache: 'no-store' });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || 'Fetch part failed'); }
    return res.json() as Promise<{ item: AdminPart }>;
}

export async function adminGetPartsStats() {
    const res = await fetch(`/api/admin/parts/stats`, { credentials: 'include', cache: 'no-store' });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || 'Fetch parts stats failed'); }
    return res.json() as Promise<AdminPartsStats>;
}

export async function adminCreatePart(body: Partial<AdminPart>) {
    const res = await fetch(`/api/admin/parts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || 'Create part failed'); }
    return res.json() as Promise<{ item: AdminPart }>;
}

export async function adminUpdatePart(mongoId: string, body: Partial<AdminPart>) {
    const res = await fetch(`/api/admin/parts/${encodeURIComponent(mongoId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || 'Update part failed'); }
    return res.json() as Promise<{ item: AdminPart }>;
}

export async function adminDeletePart(mongoId: string) {
    const res = await fetch(`/api/admin/parts/${encodeURIComponent(mongoId)}`, { method: 'DELETE', credentials: 'include' });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || 'Delete part failed'); }
    return res.json() as Promise<{ message: string }>;
}

export async function adminListTests(params?: { part?: string; level?: number }) {
    const usp = new URLSearchParams();
    if (params?.part) usp.set('part', params.part);
    if (params?.level) usp.set('level', String(params.level));
    const res = await fetch(`/api/admin/parts/tests?${usp.toString()}`, { credentials: 'include', cache: 'no-store' });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || 'Fetch tests failed'); }
    return res.json() as Promise<{ tests: AdminTest[] }>;
}

export async function adminGetTestItems(params: { part: string; level: number; test: number }) {
    const usp = new URLSearchParams();
    usp.set('part', params.part);
    usp.set('level', String(params.level));
    usp.set('test', String(params.test));
    const res = await fetch(`/api/admin/parts/test/items?${usp.toString()}`, { credentials: 'include', cache: 'no-store' });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || 'Fetch test items failed'); }
    return res.json() as Promise<{ items: AdminPart[]; stimulusMap: Record<string, AdminStimulus> }>;
}

export async function adminDeleteTest(params: { part: string; level: number; test: number }) {
    const usp = new URLSearchParams();
    usp.set('part', params.part);
    usp.set('level', String(params.level));
    usp.set('test', String(params.test));
    const res = await fetch(`/api/admin/parts/test?${usp.toString()}`, { method: 'DELETE', credentials: 'include' });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || 'Delete test failed'); }
    return res.json() as Promise<{ message: string; deletedCount: number }>;
}

export async function adminCreateTest(body: { part: string; level: number; test: number; items: AdminPart[]; stimuli?: AdminStimulus[] }) {
    const res = await fetch(`/api/admin/parts/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || 'Create test failed'); }
    return res.json() as Promise<{ message: string; count: number }>;
}

export async function adminCreateOrUpdateItem(body: AdminPart) {
    const res = await fetch(`/api/admin/parts/item`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || 'Create/update item failed'); }
    return res.json() as Promise<{ item: AdminPart }>;
}

export async function adminUploadStimulusMedia(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`/api/admin/parts/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
    });

    if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.message || 'Upload failed');
    }

    return res.json() as Promise<{ url: string; key: string; type: string; name: string; size: number }>;
}

export async function adminCreateStimulus(body: { id: string; part: string; level: number; test: number; media: any }) {
    const res = await fetch(`/api/admin/parts/stimulus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || 'Create stimulus failed'); }
    return res.json() as Promise<{ stimulus: AdminStimulus }>;
}

export async function adminUpdateStimulus(id: string, media: any) {
    const res = await fetch(`/api/admin/parts/stimulus/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ media }),
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || 'Update stimulus failed'); }
    return res.json() as Promise<{ stimulus: AdminStimulus }>;
}

export async function adminDeleteStimulus(id: string) {
    const res = await fetch(`/api/admin/parts/stimulus/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'include'
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || 'Delete stimulus failed'); }
    return res.json() as Promise<{ message: string }>;
}

export async function adminImportExcel(file: File, preview: boolean = false) {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`/api/admin/parts/import-excel?preview=${preview}`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
    });

    if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.message || 'Import Excel failed');
    }

    return res.json() as Promise<{
        message: string;
        itemsCount: number;
        stimuliCount: number;
        preview?: boolean;
        summary?: {
            test: string;
            items: any[];
            stimuli: any[];
        }[];
    }>;
}
