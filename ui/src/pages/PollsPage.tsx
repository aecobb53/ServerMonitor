import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '@/api/client';
import MarkdownText from '@/components/ui/MarkdownText';
import { Button, Card, LoadingState, PageHeader } from '@/components/ui';
import { usePageTitle } from '@/hooks/usePageTitle';
import styles from './PollsPage.module.css';

type PollType = 'single_choice' | 'multi_choice' | 'ranked_choice' | 'availability' | 'rating' | 'short_response' | 'qa';
type PollStatus = 'open' | 'closed';

interface PollOption {
  id: string;
  label: string;
}

interface PollQuestion {
  id: string;
  label: string;
}

interface PollItem {
  id: string;
  title: string;
  description: string;
  poll_type: PollType;
  status: PollStatus;
  anonymous_responses: boolean;
  allow_vote_changes: boolean;
  options: PollOption[];
  questions: PollQuestion[];
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
  response_count: number;
  summary: PollSummary;
}

interface PollSummary {
  total_responses: number;
  options: PollOptionSummary[];
  rating: PollRatingSummary;
  availability: PollAvailabilitySummary;
  recent_text_responses: PollTextResponseSummary[];
}

interface PollOptionSummary {
  option_id: string;
  label: string;
  votes: number;
  weighted_score: number;
}

interface PollRatingSummary {
  average: number | null;
  count: number;
}

interface PollAvailabilitySummary {
  windows: number;
  definitely: number;
  maybe: number;
}

interface PollTextResponseSummary {
  response_id: string;
  user: string;
  text: string;
}

interface PollForm {
  title: string;
  description: string;
  poll_type: PollType;
  status: PollStatus;
  anonymous_responses: boolean;
  allow_vote_changes: boolean;
  created_by: string;
  optionsText: string;
  questionsText: string;
}

interface PollResponsePayload {
  poll_id: string;
  user_id: string | null;
  choice_ids: string[];
  rankings: string[];
  rating: number | null;
  text: string | null;
  availability_windows: Array<{ day: string; start: string; end: string; kind: string }>;
}

interface PollResponseItem {
  id: string;
  poll_id: string;
  user_id: string | null;
  choice_ids: string[];
  rankings: string[];
  rating: number | null;
  text: string | null;
  availability_windows: Array<{ day: string; start: string; end: string; kind: string }>;
  created_at: string | null;
  updated_at: string | null;
}

interface PollResponseForm {
  user_id: string;
  choice_ids: string[];
  rankings: string[];
  rating: number | null;
  text: string;
  availabilityText: string;
}

const POLL_TYPE_LABELS: Record<PollType, string> = {
  single_choice: 'Single Choice',
  multi_choice: 'Multi Choice',
  ranked_choice: 'Ranked Choice',
  availability: 'Availability',
  rating: 'Rating',
  short_response: 'Short Response',
  qa: 'Q&A',
};

function LinkIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function createEmptyPollForm(): PollForm {
  return {
    title: '',
    description: '',
    poll_type: 'single_choice',
    status: 'open',
    anonymous_responses: false,
    allow_vote_changes: true,
    created_by: '',
    optionsText: '',
    questionsText: '',
  };
}

function createPollFormFromPoll(poll: PollItem): PollForm {
  return {
    title: poll.title,
    description: poll.description ?? '',
    poll_type: poll.poll_type,
    status: poll.status,
    anonymous_responses: poll.anonymous_responses,
    allow_vote_changes: poll.allow_vote_changes,
    created_by: poll.created_by ?? '',
    optionsText: poll.options.map((option) => option.label).join('\n'),
    questionsText: poll.questions.map((question) => question.label).join('\n'),
  };
}

function createEmptyResponseForm(): PollResponseForm {
  return {
    user_id: '',
    choice_ids: [],
    rankings: [],
    rating: null,
    text: '',
    availabilityText: '',
  };
}

function parseLinesToOptions(linesText: string): PollOption[] {
  return linesText
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((label, index) => ({ id: `opt-${index + 1}`, label }));
}

function parseLinesToQuestions(linesText: string): PollQuestion[] {
  return linesText
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((label, index) => ({ id: `q-${index + 1}`, label }));
}

function parseAvailabilityLines(linesText: string): Array<{ day: string; start: string; end: string; kind: string }> {
  return linesText
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const [day = '', start = '', end = '', kind = 'maybe'] = line.split(',').map((part) => part.trim());
      return { day, start, end, kind };
    })
    .filter((item) => item.day.length > 0 && item.start.length > 0 && item.end.length > 0);
}

function formatTimestamp(timestamp: string | null): string {
  if (!timestamp) {
    return 'Unknown';
  }

  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) {
    return timestamp;
  }

  return parsed.toLocaleString();
}

function normalizeBoolean(value: unknown, defaultValue = false): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') {
      return true;
    }
    if (normalized === 'false') {
      return false;
    }
  }
  return defaultValue;
}

function normalizePollItem(poll: PollItem): PollItem {
  return {
    ...poll,
    anonymous_responses: normalizeBoolean((poll as PollItem & { anonymous_responses: unknown }).anonymous_responses),
    allow_vote_changes: normalizeBoolean((poll as PollItem & { allow_vote_changes: unknown }).allow_vote_changes, true),
  };
}

function buildResponseBreakdownGroups(poll: PollItem, responses: PollResponseItem[]): Array<{ label: string; entries: string[] }> {
  const formatUser = (response: PollResponseItem) => response.user_id?.trim() || 'Anonymous';

  if (poll.poll_type === 'single_choice' || poll.poll_type === 'multi_choice' || poll.poll_type === 'ranked_choice') {
    return poll.options.map((option) => {
      const entries: string[] = [];

      responses.forEach((response) => {
        if (poll.poll_type === 'ranked_choice') {
          response.rankings.forEach((rankedOptionId, index) => {
            if (rankedOptionId === option.id) {
              entries.push(`${formatUser(response)} (#${index + 1})`);
            }
          });
          return;
        }

        if (response.choice_ids.includes(option.id)) {
          entries.push(formatUser(response));
        }
      });

      return {
        label: option.label,
        entries,
      };
    });
  }

  if (poll.poll_type === 'rating') {
    return [1, 2, 3, 4, 5].map((rating) => ({
      label: `Rating ${rating}`,
      entries: responses
        .filter((response) => response.rating === rating)
        .map((response) => formatUser(response)),
    }));
  }

  if (poll.poll_type === 'availability') {
    const windowMap = new Map<string, string[]>();

    responses.forEach((response) => {
      const user = formatUser(response);
      response.availability_windows.forEach((window) => {
        const label = `${window.day} ${window.start}-${window.end} (${window.kind})`;
        const entries = windowMap.get(label) ?? [];
        entries.push(user);
        windowMap.set(label, entries);
      });
    });

    return Array.from(windowMap.entries()).map(([label, entries]) => ({ label, entries }));
  }

  return responses.map((response) => ({
    label: formatUser(response),
    entries: [response.text?.trim() || 'No text provided.'],
  }));
}

export default function PollsPage() {
  usePageTitle('Polls');
  const [searchParams, setSearchParams] = useSearchParams();
  const idFilter = searchParams.get('id');

  const [polls, setPolls] = useState<PollItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [copiedPollId, setCopiedPollId] = useState<string | null>(null);

  const [showEditor, setShowEditor] = useState(false);
  const [editingPollId, setEditingPollId] = useState<string | null>(null);
  const [form, setForm] = useState<PollForm>(createEmptyPollForm());

  const [selectedPoll, setSelectedPoll] = useState<PollItem | null>(null);
  const [responseForm, setResponseForm] = useState<PollResponseForm>(createEmptyResponseForm());
  const [showResponseBreakdown, setShowResponseBreakdown] = useState(false);
  const [responseBreakdown, setResponseBreakdown] = useState<PollResponseItem[] | null>(null);
  const [loadingResponseBreakdown, setLoadingResponseBreakdown] = useState(false);
  const [responseBreakdownError, setResponseBreakdownError] = useState<string | null>(null);
  const [cardBreakdownVisibleByPollId, setCardBreakdownVisibleByPollId] = useState<Record<string, boolean>>({});
  const [cardBreakdownByPollId, setCardBreakdownByPollId] = useState<Record<string, PollResponseItem[]>>({});
  const [cardBreakdownLoadingByPollId, setCardBreakdownLoadingByPollId] = useState<Record<string, boolean>>({});
  const [cardBreakdownErrorByPollId, setCardBreakdownErrorByPollId] = useState<Record<string, string | null>>({});

  const requiresOptions = useMemo(
    () => form.poll_type === 'single_choice' || form.poll_type === 'multi_choice' || form.poll_type === 'ranked_choice',
    [form.poll_type],
  );

  const requiresQuestions = useMemo(() => form.poll_type === 'qa', [form.poll_type]);

  async function loadPolls() {
    setLoading(true);

    const query = new URLSearchParams();
    if (idFilter) {
      query.set('id', idFilter);
    }
    const qs = query.size ? `?${query.toString()}` : '';

    const response = await api.get<PollItem[] | { data?: PollItem[]; polls?: PollItem[] }>(`/polls${qs}`);
    if (response.success) {
      const payload = response.data;
      const list = Array.isArray(payload)
        ? payload
        : Array.isArray((payload as { polls?: PollItem[] }).polls)
          ? (payload as { polls: PollItem[] }).polls
          : Array.isArray((payload as { data?: PollItem[] }).data)
            ? (payload as { data: PollItem[] }).data
            : [];

      setPolls(list.map(normalizePollItem));
    } else {
      setPolls([]);
      setFeedback(response.error.message);
    }

    setLoading(false);
  }

  useEffect(() => {
    void loadPolls();
  }, [idFilter]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void loadPolls();
    }, 10000);

    return () => window.clearInterval(interval);
  }, [idFilter]);

  useEffect(() => {
    if (!selectedPoll) {
      return;
    }

    const updatedPoll = polls.find((poll) => poll.id === selectedPoll.id) ?? null;
    if (!updatedPoll) {
      setSelectedPoll(null);
      return;
    }

    if (
      updatedPoll.id === selectedPoll.id
      && updatedPoll.updated_at === selectedPoll.updated_at
      && updatedPoll.response_count === selectedPoll.response_count
      && updatedPoll.status === selectedPoll.status
    ) {
      return;
    }

    setSelectedPoll(updatedPoll);
  }, [polls, selectedPoll]);

  useEffect(() => {
    if (!idFilter || polls.length === 0 || selectedPoll) {
      return;
    }

    const match = polls.find((poll) => poll.id === idFilter);
    if (match) {
      openResponseModal(match);
    }
  }, [idFilter, polls, selectedPoll]);

  function openCreateModal() {
    setEditingPollId(null);
    setForm(createEmptyPollForm());
    setFeedback(null);
    setShowEditor(true);
  }

  function openEditModal(poll: PollItem) {
    setEditingPollId(poll.id);
    setForm(createPollFormFromPoll(poll));
    setFeedback(null);
    setShowEditor(true);
  }

  function closeEditorModal() {
    setShowEditor(false);
    setEditingPollId(null);
    setForm(createEmptyPollForm());
  }

  function openResponseModal(poll: PollItem) {
    setSelectedPoll(poll);
    setResponseForm(createEmptyResponseForm());
    setFeedback(null);
    setShowResponseBreakdown(false);
    setResponseBreakdown(null);
    setResponseBreakdownError(null);
  }

  function closeResponseModal() {
    setSelectedPoll(null);
    setResponseForm(createEmptyResponseForm());
    setShowResponseBreakdown(false);
    setResponseBreakdown(null);
    setResponseBreakdownError(null);
    if (idFilter) {
      setSearchParams({});
    }
  }

  async function toggleResponseBreakdown() {
    if (!selectedPoll || selectedPoll.anonymous_responses) {
      return;
    }

    if (showResponseBreakdown) {
      setShowResponseBreakdown(false);
      return;
    }

    if (responseBreakdown === null) {
      setLoadingResponseBreakdown(true);
      setResponseBreakdownError(null);

      const response = await api.get<PollResponseItem[] | { data?: PollResponseItem[]; responses?: PollResponseItem[] }>(`/polls/responses?poll_id=${selectedPoll.id}`);
      if (!response.success) {
        setResponseBreakdownError(response.error.message);
        setLoadingResponseBreakdown(false);
        return;
      }

      const payload = response.data;
      const list = Array.isArray(payload)
        ? payload
        : Array.isArray((payload as { responses?: PollResponseItem[] }).responses)
          ? (payload as { responses: PollResponseItem[] }).responses
          : Array.isArray((payload as { data?: PollResponseItem[] }).data)
            ? (payload as { data: PollResponseItem[] }).data
            : [];

      setResponseBreakdown(list);
      setLoadingResponseBreakdown(false);
    }

    setShowResponseBreakdown(true);
  }

  async function toggleCardResponseBreakdown(poll: PollItem) {
    if (poll.anonymous_responses) {
      return;
    }

    const isVisible = Boolean(cardBreakdownVisibleByPollId[poll.id]);
    if (isVisible) {
      setCardBreakdownVisibleByPollId((current) => ({
        ...current,
        [poll.id]: false,
      }));
      return;
    }

    if (!cardBreakdownByPollId[poll.id]) {
      setCardBreakdownLoadingByPollId((current) => ({ ...current, [poll.id]: true }));
      setCardBreakdownErrorByPollId((current) => ({ ...current, [poll.id]: null }));

      const response = await api.get<PollResponseItem[] | { data?: PollResponseItem[]; responses?: PollResponseItem[] }>(`/polls/responses?poll_id=${poll.id}`);
      if (!response.success) {
        setCardBreakdownErrorByPollId((current) => ({ ...current, [poll.id]: response.error.message }));
        setCardBreakdownLoadingByPollId((current) => ({ ...current, [poll.id]: false }));
        return;
      }

      const payload = response.data;
      const list = Array.isArray(payload)
        ? payload
        : Array.isArray((payload as { responses?: PollResponseItem[] }).responses)
          ? (payload as { responses: PollResponseItem[] }).responses
          : Array.isArray((payload as { data?: PollResponseItem[] }).data)
            ? (payload as { data: PollResponseItem[] }).data
            : [];

      setCardBreakdownByPollId((current) => ({ ...current, [poll.id]: list }));
      setCardBreakdownLoadingByPollId((current) => ({ ...current, [poll.id]: false }));
    }

    setCardBreakdownVisibleByPollId((current) => ({
      ...current,
      [poll.id]: true,
    }));
  }

  function copyPollLink(pollId: string) {
    const url = `${window.location.origin}/polls?id=${pollId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedPollId(pollId);
      setTimeout(() => setCopiedPollId(null), 2000);
    });
  }

  const responseBreakdownGroups = useMemo(
    () => (selectedPoll && responseBreakdown ? buildResponseBreakdownGroups(selectedPoll, responseBreakdown) : []),
    [responseBreakdown, selectedPoll],
  );

  function toggleChoice(optionId: string) {
    if (!selectedPoll) {
      return;
    }

    if (selectedPoll.poll_type === 'single_choice') {
      setResponseForm((current) => ({
        ...current,
        choice_ids: [optionId],
      }));
      return;
    }

    setResponseForm((current) => {
      const exists = current.choice_ids.includes(optionId);
      return {
        ...current,
        choice_ids: exists
          ? current.choice_ids.filter((id) => id !== optionId)
          : [...current.choice_ids, optionId],
      };
    });
  }

  function toggleRankedOption(optionId: string) {
    setResponseForm((current) => {
      const exists = current.rankings.includes(optionId);
      return {
        ...current,
        rankings: exists
          ? current.rankings.filter((id) => id !== optionId)
          : [...current.rankings, optionId],
      };
    });
  }

  async function handleSavePoll(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = form.title.trim();
    if (!title) {
      setFeedback('Title is required.');
      return;
    }

    const options = parseLinesToOptions(form.optionsText);
    const questions = parseLinesToQuestions(form.questionsText);

    if (requiresOptions && options.length === 0) {
      setFeedback('Add at least one option for this poll type.');
      return;
    }

    if (requiresQuestions && questions.length === 0) {
      setFeedback('Add at least one question for Q&A polls.');
      return;
    }

    const pollPayload = {
      id: editingPollId,
      title,
      description: form.description.trim(),
      poll_type: form.poll_type,
      status: form.status,
      anonymous_responses: form.anonymous_responses,
      allow_vote_changes: form.allow_vote_changes,
      options,
      questions,
      created_by: form.created_by.trim() || null,
      response_count: 0,
    };

    const response = editingPollId
      ? await api.put<PollItem>(`/polls/${editingPollId}`, pollPayload)
      : await api.post<PollItem>('/polls', pollPayload);

    if (!response.success) {
      setFeedback(response.error.message);
      return;
    }

    await loadPolls();
    setFeedback(editingPollId ? 'Poll updated.' : 'Poll created.');
    closeEditorModal();
  }

  async function handleSubmitResponse(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedPoll) {
      return;
    }

    if (selectedPoll.status === 'closed') {
      setFeedback('This poll is closed.');
      return;
    }

    const trimmedUser = responseForm.user_id.trim();
    const trimmedText = responseForm.text.trim();
    const availabilityWindows = parseAvailabilityLines(responseForm.availabilityText);

    if (!selectedPoll.anonymous_responses && !trimmedUser) {
      setFeedback('A handle is required for this poll.');
      return;
    }

    if (selectedPoll.poll_type === 'single_choice' && responseForm.choice_ids.length !== 1) {
      setFeedback('Select exactly one option.');
      return;
    }

    if (selectedPoll.poll_type === 'multi_choice' && responseForm.choice_ids.length === 0) {
      setFeedback('Select at least one option.');
      return;
    }

    if (selectedPoll.poll_type === 'ranked_choice' && responseForm.rankings.length === 0) {
      setFeedback('Select at least one ranked option.');
      return;
    }

    if (selectedPoll.poll_type === 'rating' && !responseForm.rating) {
      setFeedback('Select a rating from 1 to 5.');
      return;
    }

    if ((selectedPoll.poll_type === 'short_response' || selectedPoll.poll_type === 'qa') && !trimmedText) {
      setFeedback('Response text is required.');
      return;
    }

    if (selectedPoll.poll_type === 'availability' && availabilityWindows.length === 0) {
      setFeedback('Add at least one availability row.');
      return;
    }

    const payload: PollResponsePayload = {
      poll_id: selectedPoll.id,
      user_id: trimmedUser || null,
      choice_ids: responseForm.choice_ids,
      rankings: responseForm.rankings,
      rating: responseForm.rating,
      text: trimmedText || null,
      availability_windows: availabilityWindows,
    };

    const response = await api.post('/polls/responses', payload);
    if (!response.success) {
      setFeedback(response.error.message);
      return;
    }

    setFeedback('Response submitted. Results updated.');
    await loadPolls();
    setResponseForm(createEmptyResponseForm());
  }


  return (
    <div className={styles.root}>
      <PageHeader
        title="Polls"
        subtitle="Collect structured community input and keep it organized for future events and requests."
      />

      <div className={styles.toolbar}>
        <Button onClick={openCreateModal}>Create Poll</Button>
      </div>

      {idFilter && (
        <div className={styles.filterBanner}>
          Showing linked poll.{' '}
          <button className={styles.clearFilter} type="button" onClick={() => setSearchParams({})}>
            Show all polls
          </button>
        </div>
      )}

      {feedback && <p className={styles.feedback}>{feedback}</p>}

      {loading ? (
        <LoadingState message="Loading polls..." />
      ) : polls.length === 0 ? (
        <Card className={styles.emptyCard}>
          <h2 className={styles.emptyTitle}>No polls yet.</h2>
          <p className={styles.emptyText}>Create one to start collecting community input.</p>
          <Button onClick={openCreateModal}>Create Poll</Button>
        </Card>
      ) : (
        <div className={styles.list}>
          {polls.map((poll) => {
            const summary = poll.summary ?? {
              total_responses: poll.response_count,
              options: [],
              rating: { average: null, count: 0 },
              availability: { windows: 0, definitely: 0, maybe: 0 },
              recent_text_responses: [],
            };

            return (
              <Card key={poll.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <h2 className={styles.title}>{poll.title}</h2>
                    <p className={styles.meta}>{POLL_TYPE_LABELS[poll.poll_type]} · {poll.status.toUpperCase()}</p>
                  </div>
                  <div className={styles.badges}>
                    <span className={styles.countBadge}>{poll.response_count} responses</span>
                  </div>
                </div>

                {poll.description && <MarkdownText className={styles.description} content={poll.description} />}

                <div className={styles.resultsSection}>
                  <p className={styles.resultsTitle}>Results</p>

                  {(poll.poll_type === 'single_choice' || poll.poll_type === 'multi_choice') && poll.options.length > 0 && (
                    <div className={styles.resultsList}>
                      {summary.options.map((optionSummary) => (
                        <div key={optionSummary.option_id} className={styles.resultRow}>
                          <span>{optionSummary.label}</span>
                          <span className={styles.resultValue}>{optionSummary.votes} votes</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {poll.poll_type === 'ranked_choice' && poll.options.length > 0 && (
                    <div className={styles.resultsList}>
                      {summary.options.map((optionSummary) => (
                        <div key={optionSummary.option_id} className={styles.resultRow}>
                          <span>{optionSummary.label}</span>
                          <span className={styles.resultValue}>{optionSummary.weighted_score} score</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {poll.poll_type === 'rating' && (
                    summary.rating.count > 0 && summary.rating.average !== null ? (
                      <p className={styles.helperText}>Average rating: {summary.rating.average.toFixed(2)} ({summary.rating.count} responses)</p>
                    ) : (
                      <p className={styles.helperText}>No ratings submitted yet.</p>
                    )
                  )}

                  {poll.poll_type === 'availability' && (
                    <>
                      <p className={styles.helperText}>{summary.availability.windows} windows submitted</p>
                      <p className={styles.helperText}>Definitely: {summary.availability.definitely} · Maybe: {summary.availability.maybe}</p>
                    </>
                  )}

                  {(poll.poll_type === 'short_response' || poll.poll_type === 'qa') && (
                    summary.recent_text_responses.length > 0 ? (
                      <div className={styles.resultsList}>
                        {summary.recent_text_responses.map((item) => (
                          <div key={item.response_id} className={styles.textResultItem}>
                            <p className={styles.textResultUser}>{item.user}</p>
                            <MarkdownText className={styles.textResultBody} content={item.text} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className={styles.helperText}>No text responses submitted yet.</p>
                    )
                  )}

                  {poll.status === 'closed' && summary.total_responses === 0 && (
                    <p className={styles.helperText}>Poll is closed. No responses were submitted.</p>
                  )}

                  <p className={styles.helperText}>{summary.total_responses} total responses</p>

                  {!poll.anonymous_responses && (
                    <div className={styles.breakdownSection}>
                      <Button type="button" variant="ghost" size="sm" onClick={() => toggleCardResponseBreakdown(poll)}>
                        {cardBreakdownVisibleByPollId[poll.id] ? 'Hide Results' : 'Show Results'}
                      </Button>

                      {cardBreakdownLoadingByPollId[poll.id] && <p className={styles.helperText}>Loading voter breakdown...</p>}
                      {cardBreakdownErrorByPollId[poll.id] && <p className={styles.breakdownError}>{cardBreakdownErrorByPollId[poll.id]}</p>}

                      {cardBreakdownVisibleByPollId[poll.id] && !cardBreakdownLoadingByPollId[poll.id] && !cardBreakdownErrorByPollId[poll.id] && (
                        (cardBreakdownByPollId[poll.id]?.length ?? 0) > 0 ? (
                          <div className={styles.breakdownList}>
                            {buildResponseBreakdownGroups(poll, cardBreakdownByPollId[poll.id]).map((group) => (
                              <div key={group.label} className={styles.breakdownGroup}>
                                <p className={styles.breakdownLabel}>{group.label}</p>
                                {group.entries.length > 0 ? (
                                  <ul className={styles.breakdownEntries}>
                                    {group.entries.map((entry, index) => (
                                      <li key={`${entry}-${index}`}>{entry}</li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className={styles.helperText}>No responses for this result yet.</p>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className={styles.helperText}>No detailed responses available yet.</p>
                        )
                      )}
                    </div>
                  )}
                </div>

                {poll.options.length > 0 && (
                  <ul className={styles.previewList}>
                    {poll.options.slice(0, 4).map((option) => (
                      <li key={option.id}>{option.label}</li>
                    ))}
                  </ul>
                )}

                {poll.questions.length > 0 && (
                  <ul className={styles.previewList}>
                    {poll.questions.slice(0, 4).map((question) => (
                      <li key={question.id}>{question.label}</li>
                    ))}
                  </ul>
                )}

                <div className={styles.footer}>
                  <p className={styles.timestamp}>Updated {formatTimestamp(poll.updated_at ?? poll.created_at)}</p>
                  <div className={styles.footerActions}>
                    <button
                      type="button"
                      className={styles.copyButton}
                      onClick={() => copyPollLink(poll.id)}
                      aria-label="Copy link to this poll"
                      title={copiedPollId === poll.id ? 'Copied!' : 'Copy link'}
                    >
                      <LinkIcon />
                    </button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => openEditModal(poll)}>Edit</Button>
                    <Button type="button" size="sm" onClick={() => openResponseModal(poll)}>
                      {poll.status === 'closed' ? 'View Poll' : 'Respond'}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {showEditor && (
        <div className={styles.overlay} role="presentation" onClick={closeEditorModal}>
          <div className={styles.modal} role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{editingPollId ? 'Edit Poll' : 'Create Poll'}</h2>
              <button className={styles.closeButton} type="button" onClick={closeEditorModal} aria-label="Close poll editor">×</button>
            </div>

            <form className={styles.form} onSubmit={handleSavePoll}>
              <label className={styles.field}>
                <span>Title</span>
                <input
                  value={form.title}
                  onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Which night should we raid?"
                />
              </label>

              <label className={styles.field}>
                <span>Description</span>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                />
              </label>

              <div className={styles.fieldRow}>
                <label className={styles.field}>
                  <span>Poll Type</span>
                  <select
                    value={form.poll_type}
                    onChange={(event) => setForm((current) => ({ ...current, poll_type: event.target.value as PollType }))}
                  >
                    {Object.entries(POLL_TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </label>

                <label className={styles.field}>
                  <span>Status</span>
                  <select
                    value={form.status}
                    onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as PollStatus }))}
                  >
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                  </select>
                </label>
              </div>

              <label className={styles.field}>
                <span>Created By <span className={styles.optional}>(optional)</span></span>
                <input
                  value={form.created_by}
                  onChange={(event) => setForm((current) => ({ ...current, created_by: event.target.value }))}
                  placeholder="admin"
                />
              </label>

              {(requiresOptions || form.poll_type === 'availability') && (
                <label className={styles.field}>
                  <span>Options <span className={styles.optional}>(one per line)</span></span>
                  <textarea
                    rows={5}
                    value={form.optionsText}
                    onChange={(event) => setForm((current) => ({ ...current, optionsText: event.target.value }))}
                    placeholder={'Friday 8 PM\nSaturday 8 PM'}
                  />
                </label>
              )}

              {requiresQuestions && (
                <label className={styles.field}>
                  <span>Questions <span className={styles.optional}>(one per line)</span></span>
                  <textarea
                    rows={5}
                    value={form.questionsText}
                    onChange={(event) => setForm((current) => ({ ...current, questionsText: event.target.value }))}
                    placeholder={'What food should we bring?\nWho can host?'}
                  />
                </label>
              )}

              <div className={styles.toggles}>
                <label className={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    checked={form.anonymous_responses}
                    onChange={(event) => setForm((current) => ({ ...current, anonymous_responses: event.target.checked }))}
                  />
                  Anonymous responses
                </label>
                <label className={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    checked={form.allow_vote_changes}
                    onChange={(event) => setForm((current) => ({ ...current, allow_vote_changes: event.target.checked }))}
                  />
                  Allow vote changes
                </label>
              </div>

              <div className={styles.modalActions}>
                <Button type="button" variant="ghost" onClick={closeEditorModal}>Cancel</Button>
                <Button type="submit">{editingPollId ? 'Save Poll' : 'Create Poll'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedPoll && (
        <div className={styles.overlay} role="presentation" onClick={closeResponseModal}>
          <div className={styles.modal} role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{selectedPoll.title}</h2>
              <button className={styles.closeButton} type="button" onClick={closeResponseModal} aria-label="Close poll response">×</button>
            </div>

            <MarkdownText className={styles.description} content={selectedPoll.description} />

            <div className={styles.resultsSection}>
              <p className={styles.resultsTitle}>Current Results</p>
              {(selectedPoll.poll_type === 'single_choice' || selectedPoll.poll_type === 'multi_choice' || selectedPoll.poll_type === 'ranked_choice') && (
                <div className={styles.resultsList}>
                  {selectedPoll.summary.options.map((optionSummary) => (
                    <div key={optionSummary.option_id} className={styles.resultRow}>
                      <span>{optionSummary.label}</span>
                      <span className={styles.resultValue}>
                        {selectedPoll.poll_type === 'ranked_choice' ? `${optionSummary.weighted_score} score` : `${optionSummary.votes} votes`}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {selectedPoll.poll_type === 'rating' && (
                selectedPoll.summary.rating.count > 0 && selectedPoll.summary.rating.average !== null ? (
                  <p className={styles.helperText}>Average rating: {selectedPoll.summary.rating.average.toFixed(2)} ({selectedPoll.summary.rating.count} responses)</p>
                ) : (
                  <p className={styles.helperText}>No ratings submitted yet.</p>
                )
              )}

              {selectedPoll.poll_type === 'availability' && (
                <>
                  <p className={styles.helperText}>{selectedPoll.summary.availability.windows} windows submitted</p>
                  <p className={styles.helperText}>Definitely: {selectedPoll.summary.availability.definitely} · Maybe: {selectedPoll.summary.availability.maybe}</p>
                </>
              )}

              {(selectedPoll.poll_type === 'short_response' || selectedPoll.poll_type === 'qa') && (
                selectedPoll.summary.recent_text_responses.length > 0 ? (
                  <div className={styles.resultsList}>
                    {selectedPoll.summary.recent_text_responses.map((item) => (
                      <div key={item.response_id} className={styles.textResultItem}>
                        <p className={styles.textResultUser}>{item.user}</p>
                        <MarkdownText className={styles.textResultBody} content={item.text} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.helperText}>No text responses submitted yet.</p>
                )
              )}

              <p className={styles.helperText}>{selectedPoll.summary.total_responses} total responses</p>

              {!selectedPoll.anonymous_responses && (
                <div className={styles.breakdownSection}>
                  <Button type="button" variant="ghost" size="sm" onClick={toggleResponseBreakdown}>
                    {showResponseBreakdown ? 'Hide Results' : 'Show Results'}
                  </Button>

                  {loadingResponseBreakdown && <p className={styles.helperText}>Loading voter breakdown...</p>}
                  {responseBreakdownError && <p className={styles.breakdownError}>{responseBreakdownError}</p>}

                  {showResponseBreakdown && responseBreakdown && !loadingResponseBreakdown && !responseBreakdownError && (
                    responseBreakdownGroups.length > 0 ? (
                      <div className={styles.breakdownList}>
                        {responseBreakdownGroups.map((group) => (
                          <div key={group.label} className={styles.breakdownGroup}>
                            <p className={styles.breakdownLabel}>{group.label}</p>
                            {group.entries.length > 0 ? (
                              <ul className={styles.breakdownEntries}>
                                {group.entries.map((entry, index) => (
                                  <li key={`${entry}-${index}`}>{entry}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className={styles.helperText}>No responses for this result yet.</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className={styles.helperText}>No detailed responses available yet.</p>
                    )
                  )}
                </div>
              )}
            </div>

            <form className={styles.form} onSubmit={handleSubmitResponse}>
              <label className={styles.field}>
                <span>Your Handle {selectedPoll.anonymous_responses && <span className={styles.optional}>(optional)</span>}</span>
                <input
                  value={responseForm.user_id}
                  onChange={(event) => setResponseForm((current) => ({ ...current, user_id: event.target.value }))}
                  placeholder="viking_123"
                  disabled={selectedPoll.status === 'closed'}
                />
              </label>

              {(selectedPoll.poll_type === 'single_choice' || selectedPoll.poll_type === 'multi_choice') && (
                <div className={styles.optionList}>
                  {selectedPoll.options.map((option) => (
                    <div key={option.id} className={styles.resultRow}>
                      <label className={styles.checkboxRow}>
                        <input
                          type={selectedPoll.poll_type === 'single_choice' ? 'radio' : 'checkbox'}
                          name="choices"
                          checked={responseForm.choice_ids.includes(option.id)}
                          onChange={() => toggleChoice(option.id)}
                          disabled={selectedPoll.status === 'closed'}
                        />
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>
              )}

              {selectedPoll.poll_type === 'ranked_choice' && (
                <div className={styles.optionList}>
                  <p className={styles.helperText}>Select options in priority order. Click again to remove.</p>
                  {selectedPoll.options.map((option) => {
                    const rankIndex = responseForm.rankings.indexOf(option.id);
                    return (
                      <button
                        key={option.id}
                        type="button"
                        className={styles.rankButton}
                        onClick={() => toggleRankedOption(option.id)}
                        disabled={selectedPoll.status === 'closed'}
                      >
                        <span>{option.label}</span>
                        <span className={styles.rankBadge}>{rankIndex >= 0 ? `#${rankIndex + 1}` : 'Not ranked'}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {selectedPoll.poll_type === 'rating' && (
                <>
                  <div className={styles.ratingRow}>
                    {[1, 2, 3, 4, 5].map((value) => (
                      <label key={value} className={styles.checkboxRow}>
                        <input
                          type="radio"
                          name="rating"
                          checked={responseForm.rating === value}
                          onChange={() => setResponseForm((current) => ({ ...current, rating: value }))}
                          disabled={selectedPoll.status === 'closed'}
                        />
                        {value}
                      </label>
                    ))}
                  </div>
                </>
              )}

              {selectedPoll.poll_type === 'availability' && (
                <label className={styles.field}>
                  <span>Availability Windows <span className={styles.optional}>(day,start,end,kind per line)</span></span>
                  <textarea
                    rows={5}
                    value={responseForm.availabilityText}
                    onChange={(event) => setResponseForm((current) => ({ ...current, availabilityText: event.target.value }))}
                    placeholder={'Friday,18:00,21:00,definitely\nFriday,21:00,23:00,maybe'}
                    disabled={selectedPoll.status === 'closed'}
                  />
                </label>
              )}

              {(selectedPoll.poll_type === 'short_response' || selectedPoll.poll_type === 'qa') && (
                <label className={styles.field}>
                  <span>Response</span>
                  {selectedPoll.poll_type === 'qa' && selectedPoll.questions.length > 0 && (
                    <ul className={styles.previewList}>
                      {selectedPoll.questions.map((question) => (
                        <li key={question.id}>{question.label}</li>
                      ))}
                    </ul>
                  )}
                  <textarea
                    rows={6}
                    maxLength={500}
                    value={responseForm.text}
                    onChange={(event) => setResponseForm((current) => ({ ...current, text: event.target.value }))}
                    disabled={selectedPoll.status === 'closed'}
                    placeholder="Share your response"
                  />
                </label>
              )}

              <div className={styles.modalActions}>
                <Button type="button" variant="ghost" onClick={closeResponseModal}>Close</Button>
                {selectedPoll.status !== 'closed' && <Button type="submit">Submit Response</Button>}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
