import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie } from 'recharts';

const supabase = createClient(
  'https://rcouovmmxiruyolmjlew.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjb3Vvdm1teGlydXlvbG1qbGV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMDk5MDQsImV4cCI6MjA4NjU4NTkwNH0.DxDRmjVhdLZmrfJXeSIVDSX2u81IACe85CKwQerZTAs'
);

// ─── Constants ───────────────────────────────────────────────────────────────
const SUITS = ['Spades', 'Hearts', 'Clubs', 'Diamonds'];
const VALUES = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
const SUIT_ICONS = { Spades: '♠', Hearts: '♥', Clubs: '♣', Diamonds: '♦' };
const SUIT_COLORS = { Spades: '#64748b', Hearts: '#ef4444', Clubs: '#22c55e', Diamonds: '#3b82f6' };
const SUIT_MEANINGS = { Spades: 'Strength', Hearts: 'Cardio / Movement', Clubs: 'Wild (Any)', Diamonds: 'Group / Social' };

function getBonusPoints(value) {
  if (['2','3','4','5'].includes(value)) return 1;
  if (['6','7','8','9','10'].includes(value)) return 2;
  if (['J','Q','K'].includes(value)) return 3;
  if (value === 'A') return 5;
  return 0;
}

function getMonday(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff)).toISOString().split('T')[0];
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─── Card Component ──────────────────────────────────────────────────────────
function PlayingCard({ cardName, suit, value, bonus, claimedBy, status, compact, onClick }) {
  const isRed = suit === 'Hearts' || suit === 'Diamonds';
  const isClaimed = status === 'Claimed';
  return (
    <div
      onClick={onClick}
      className={`playing-card ${isClaimed ? 'claimed' : ''} ${compact ? 'compact' : ''}`}
      style={{
        '--card-color': isRed ? '#dc2626' : '#1e293b',
        '--card-bg': isClaimed ? '#1e293b' : '#fefefe',
        cursor: onClick ? 'pointer' : 'default'
      }}
    >
      <div className="card-corner top-left">
        <span className="card-value">{value}</span>
        <span className="card-suit">{SUIT_ICONS[suit]}</span>
      </div>
      <div className="card-center">
        <span className="card-suit-large">{SUIT_ICONS[suit]}</span>
      </div>
      <div className="card-corner bottom-right">
        <span className="card-value">{value}</span>
        <span className="card-suit">{SUIT_ICONS[suit]}</span>
      </div>
      {isClaimed && (
        <div className="card-claimed-overlay">
          <span>✓ {claimedBy}</span>
        </div>
      )}
      <div className="card-bonus">+{bonus}</div>
    </div>
  );
}

// ─── Tab Navigation ──────────────────────────────────────────────────────────
function TabNav({ active, onChange }) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'cards', label: 'Weekly Cards', icon: '🃏' },
    { id: 'log', label: 'Log Workout', icon: '💪' },
    { id: 'history', label: 'History', icon: '📋' },
  ];
  return (
    <nav className="tab-nav">
      {tabs.map(t => (
        <button
          key={t.id}
          className={`tab-btn ${active === t.id ? 'active' : ''}`}
          onClick={() => onChange(t.id)}
        >
          <span className="tab-icon">{t.icon}</span>
          <span className="tab-label">{t.label}</span>
        </button>
      ))}
    </nav>
  );
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
function Dashboard({ workouts, people, weeklyCards }) {
  const now = new Date();
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [viewYear, setViewYear] = useState(now.getFullYear());

  const isCurrentMonth = viewMonth === now.getMonth() && viewYear === now.getFullYear();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysLeft = isCurrentMonth ? daysInMonth - now.getDate() : 0;

  const monthName = new Date(viewYear, viewMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (isCurrentMonth) return;
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  const monthWorkouts = workouts.filter(w => {
    const d = new Date(w.date + 'T00:00:00');
    return d.getMonth() === viewMonth && d.getFullYear() === viewYear;
  });

  // Points per person
  const pointsByPerson = {};
  people.forEach(p => { pointsByPerson[p.name] = 0; });
  monthWorkouts.forEach(w => {
    const names = w.persons.split(',').map(n => n.trim());
    const pointsEach = w.total_points / names.length;
    names.forEach(n => {
      if (pointsByPerson[n] !== undefined) pointsByPerson[n] += pointsEach;
    });
  });

  const totalPoints = Object.values(pointsByPerson).reduce((a, b) => a + b, 0);
  const goalProgress = Math.min((totalPoints / 100) * 100, 100);

  // Cumulative points over time
  const dateMap = {};
  monthWorkouts.forEach(w => {
    if (!dateMap[w.date]) dateMap[w.date] = 0;
    dateMap[w.date] += w.total_points;
  });
  const sortedDates = Object.keys(dateMap).sort();
  let cumulative = 0;
  const cumulativeData = sortedDates.map(d => {
    cumulative += dateMap[d];
    return { date: formatDate(d), points: cumulative };
  });

  // Suit distribution
  const suitCounts = { Spades: 0, Hearts: 0, Clubs: 0, Diamonds: 0 };
  monthWorkouts.forEach(w => {
    if (w.card_used) {
      const suit = w.card_used.split(' of ')[1];
      if (suit && suitCounts[suit] !== undefined) suitCounts[suit]++;
    }
  });
  const suitData = Object.entries(suitCounts).map(([suit, count]) => ({
    name: suit, value: count, fill: SUIT_COLORS[suit]
  }));

  // Leaderboard
  const leaderboard = Object.entries(pointsByPerson)
    .map(([name, pts]) => ({ name, points: Math.round(pts * 10) / 10 }))
    .sort((a, b) => b.points - a.points);

  // Cards available this week
  const availableCards = weeklyCards.filter(c => c.status === 'Available').length;
  const totalCards = weeklyCards.length;

  return (
    <div className="dashboard">
      {/* Month Selector */}
      <div className="month-selector">
        <button className="month-nav" onClick={prevMonth}>‹</button>
        <span className="month-label">{monthName}</span>
        <button className="month-nav" onClick={nextMonth} disabled={isCurrentMonth}>›</button>
      </div>

      {/* First-run guidance */}
      {isCurrentMonth && people.length === 0 && monthWorkouts.length === 0 && (
        <div className="dash-card onboarding-card">
          <div className="onboarding-title">Welcome to Deck Game!</div>
          <div className="onboarding-steps">
            <div className="onboarding-step"><span className="step-num">1</span> Add players in <strong>Settings</strong> (gear icon)</div>
            <div className="onboarding-step"><span className="step-num">2</span> Draw cards in <strong>Weekly Cards</strong></div>
            <div className="onboarding-step"><span className="step-num">3</span> Start logging workouts to earn points</div>
          </div>
        </div>
      )}

      {/* Goal Progress */}
      <div className="dash-card goal-card">
        <div className="dash-card-header">
          <h3>Monthly Goal</h3>
          {isCurrentMonth ? (
            <span className="dash-badge">{daysLeft} days left</span>
          ) : (
            <span className="dash-badge">{goalProgress >= 100 ? 'Goal reached!' : 'Past month'}</span>
          )}
        </div>
        <div className="goal-display">
          <div className="goal-number">{Math.round(totalPoints)}</div>
          <div className="goal-target">/ 100 pts</div>
        </div>
        <div className="progress-bar-container">
          <div className="progress-bar" style={{ width: `${goalProgress}%` }}>
            <div className="progress-glow"></div>
          </div>
        </div>
        <div className="goal-subtitle">{Math.round(goalProgress)}% complete</div>
      </div>

      {/* Quick Stats */}
      <div className="stats-row">
        <div className="dash-card stat-card">
          <div className="stat-number">{monthWorkouts.length}</div>
          <div className="stat-label">Workouts Logged</div>
        </div>
        <div className="dash-card stat-card">
          <div className="stat-number">{availableCards}/{totalCards}</div>
          <div className="stat-label">Cards Available</div>
        </div>
        <div className="dash-card stat-card">
          <div className="stat-number">{people.length}</div>
          <div className="stat-label">Players</div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="dash-card">
        <h3 className="dash-card-title">Leaderboard</h3>
        <div className="leaderboard">
          {leaderboard.map((p, i) => (
            <div key={p.name} className="leader-row">
              <div className="leader-rank">
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
              </div>
              <div className="leader-name">{p.name}</div>
              <div className="leader-bar-container">
                <div
                  className="leader-bar"
                  style={{ width: `${leaderboard[0]?.points ? (p.points / leaderboard[0].points) * 100 : 0}%` }}
                ></div>
              </div>
              <div className="leader-points">{p.points} pts</div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Row */}
      <div className="charts-row">
        <div className="dash-card chart-card">
          <h3 className="dash-card-title">Points Over Time</h3>
          {cumulativeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={cumulativeData}>
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }}
                />
                <Line type="monotone" dataKey="points" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3, fill: '#f59e0b' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-empty">Log workouts to see your progress!</div>
          )}
        </div>

        <div className="dash-card chart-card">
          <h3 className="dash-card-title">Card Suits Used</h3>
          {suitData.some(s => s.value > 0) ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={suitData}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {suitData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-empty">Use cards to see suit breakdown!</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Weekly Cards Manager ────────────────────────────────────────────────────
function WeeklyCardsManager({ weeklyCards, people, onRefresh, onError }) {
  const [claimModal, setClaimModal] = useState(null);
  const [claimPerson, setClaimPerson] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [pickerSuit, setPickerSuit] = useState('Spades');
  const [pickerValue, setPickerValue] = useState('2');
  const [saving, setSaving] = useState(false);

  const currentWeekStart = getMonday(new Date());
  const thisWeekCards = weeklyCards.filter(c => c.week_start_date === currentWeekStart);

  async function addCard() {
    if (thisWeekCards.length >= 7) return;
    setSaving(true);
    const cardName = `${pickerValue} of ${pickerSuit}`;
    if (thisWeekCards.some(c => c.card_name === cardName)) {
      setSaving(false);
      onError('That card is already in this week!');
      return;
    }
    const { error } = await supabase.from('weekly_cards').insert({
      week_start_date: currentWeekStart,
      card_name: cardName,
      suit: pickerSuit,
      value: pickerValue,
      bonus_points: getBonusPoints(pickerValue),
      status: 'Available',
      claimed_by: null
    });
    if (error) { onError('Failed to add card. Please try again.'); setSaving(false); return; }
    await onRefresh();
    setSaving(false);
  }

  async function removeCard(cardId) {
    const { error } = await supabase.from('weekly_cards').delete().eq('id', cardId);
    if (error) { onError('Failed to remove card.'); return; }
    await onRefresh();
  }

  async function clearWeek() {
    if (!window.confirm('Remove all cards for this week?')) return;
    const { error } = await supabase.from('weekly_cards').delete().eq('week_start_date', currentWeekStart);
    if (error) { onError('Failed to clear cards.'); return; }
    await onRefresh();
  }

  async function claimCard(card) {
    if (!claimPerson) return;
    const { error } = await supabase.from('weekly_cards')
      .update({ claimed_by: claimPerson, status: 'Claimed' })
      .eq('id', card.id);
    if (error) { onError('Failed to claim card.'); return; }
    setClaimModal(null);
    setClaimPerson('');
    await onRefresh();
  }

  async function unclaimCard(card) {
    const { error } = await supabase.from('weekly_cards')
      .update({ claimed_by: null, status: 'Available' })
      .eq('id', card.id);
    if (error) { onError('Failed to unclaim card.'); return; }
    await onRefresh();
  }

  return (
    <div className="cards-manager">
      <div className="cards-header">
        <div>
          <h2>Weekly Cards</h2>
          <p className="cards-week">Week of {formatDate(currentWeekStart)}</p>
        </div>
        <div className="cards-header-actions">
          {thisWeekCards.length > 0 && (
            <button className="btn btn-small btn-ghost" onClick={clearWeek}>Clear All</button>
          )}
          <button
            className="btn btn-primary draw-btn"
            onClick={() => setShowPicker(!showPicker)}
            disabled={thisWeekCards.length >= 7}
          >
            {thisWeekCards.length >= 7 ? '7/7 Cards Set' : `+ Add Card (${thisWeekCards.length}/7)`}
          </button>
        </div>
      </div>

      {/* Card Picker */}
      {showPicker && thisWeekCards.length < 7 && (
        <div className="card-picker">
          <div className="picker-row">
            <div className="picker-field">
              <label className="form-label">Value</label>
              <div className="picker-values">
                {VALUES.map(v => (
                  <button
                    key={v}
                    type="button"
                    className={`picker-val-btn ${pickerValue === v ? 'active' : ''}`}
                    onClick={() => setPickerValue(v)}
                  >
                    {v}
                    <span className="picker-bonus">+{getBonusPoints(v)}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="picker-field">
              <label className="form-label">Suit</label>
              <div className="picker-suits">
                {SUITS.map(s => (
                  <button
                    key={s}
                    type="button"
                    className={`picker-suit-btn ${pickerSuit === s ? 'active' : ''}`}
                    style={{ '--suit-color': SUIT_COLORS[s] }}
                    onClick={() => setPickerSuit(s)}
                  >
                    <span className="picker-suit-icon">{SUIT_ICONS[s]}</span>
                    <span className="picker-suit-name">{s}</span>
                    <span className="picker-suit-meaning">{SUIT_MEANINGS[s]}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="picker-preview">
            <PlayingCard
              cardName={`${pickerValue} of ${pickerSuit}`}
              suit={pickerSuit}
              value={pickerValue}
              bonus={getBonusPoints(pickerValue)}
              status="Available"
              compact
            />
            <button className="btn btn-primary" onClick={addCard} disabled={saving}>
              {saving ? 'Adding...' : `Add ${pickerValue} of ${pickerSuit}`}
            </button>
          </div>
        </div>
      )}

      {/* Card Legend */}
      <div className="suit-legend">
        {SUITS.map(s => (
          <div key={s} className="legend-item" style={{ color: SUIT_COLORS[s] }}>
            <span className="legend-icon">{SUIT_ICONS[s]}</span>
            <span className="legend-text">{SUIT_MEANINGS[s]}</span>
          </div>
        ))}
      </div>

      {/* Cards Grid */}
      {thisWeekCards.length > 0 ? (
        <div className="cards-grid">
          {thisWeekCards.map(card => (
            <div key={card.id} className="card-wrapper">
              <PlayingCard
                cardName={card.card_name}
                suit={card.suit}
                value={card.value}
                bonus={card.bonus_points}
                claimedBy={card.claimed_by}
                status={card.status}
                onClick={() => {
                  if (card.status === 'Available') {
                    setClaimModal(card);
                    setClaimPerson('');
                  }
                }}
              />
              <div className="card-actions">
                {card.status === 'Claimed' ? (
                  <button className="btn btn-small btn-ghost" onClick={() => unclaimCard(card)}>
                    Unclaim
                  </button>
                ) : (
                  <>
                    <button className="btn btn-small btn-accent" onClick={() => { setClaimModal(card); setClaimPerson(''); }}>
                      Claim
                    </button>
                    <button className="btn btn-small btn-ghost" onClick={() => removeCard(card.id)} title="Remove card">
                      ✕
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="cards-empty">
          <div className="empty-icon">🃏</div>
          <p>No cards added this week yet!</p>
          <p className="empty-sub">Click "Add Card" to enter cards from your real deck</p>
        </div>
      )}

      {/* Claim Modal */}
      {claimModal && (
        <div className="modal-overlay" onClick={() => setClaimModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Claim Card</h3>
            <p className="modal-card-name">
              <span style={{ color: SUIT_COLORS[claimModal.suit] }}>
                {SUIT_ICONS[claimModal.suit]}
              </span> {claimModal.card_name} (+{claimModal.bonus_points} bonus)
            </p>
            <label className="form-label">Who's claiming this card?</label>
            <select
              className="form-select"
              value={claimPerson}
              onChange={e => setClaimPerson(e.target.value)}
            >
              <option value="">Select person...</option>
              {people.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
            </select>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setClaimModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => claimCard(claimModal)} disabled={!claimPerson}>
                Confirm Claim
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Log Workout ─────────────────────────────────────────────────────────────
function LogWorkout({ people, weeklyCards, onRefresh, onError }) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedPeople, setSelectedPeople] = useState([]);
  const [activity, setActivity] = useState('');
  const [selectedCard, setSelectedCard] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const currentWeekStart = getMonday(new Date());
  const availableCards = weeklyCards.filter(
    c => c.week_start_date === currentWeekStart && c.status === 'Available'
  );

  function togglePerson(name) {
    setSelectedPeople(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (selectedPeople.length === 0 || !activity) return;
    setSaving(true);

    const card = availableCards.find(c => c.card_name === selectedCard);
    const bonus = card ? card.bonus_points : 0;
    const basePoints = selectedPeople.length; // 1 point per person
    const totalPoints = basePoints + bonus;

    const { error } = await supabase.from('workouts').insert({
      date,
      persons: selectedPeople.join(', '),
      activity,
      num_people: selectedPeople.length,
      card_used: selectedCard || null,
      bonus_points: bonus,
      total_points: totalPoints,
      notes: notes || null,
    });

    if (!error && card) {
      await supabase.from('weekly_cards')
        .update({ claimed_by: selectedPeople.join(', '), status: 'Claimed' })
        .eq('id', card.id);
    }

    setSaving(false);
    if (error) {
      onError('Failed to log workout. Please try again.');
      return;
    }
    setSuccess(true);
    setSelectedPeople([]);
    setActivity('');
    setSelectedCard('');
    setNotes('');
    await onRefresh();
    setTimeout(() => setSuccess(false), 2500);
  }

  return (
    <div className="log-workout">
      <h2>Log Workout</h2>

      {success && (
        <div className="success-toast">
          <span>✅ Workout logged successfully!</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Date */}
        <div className="form-group">
          <label className="form-label">Date</label>
          <input type="date" className="form-input" value={date} onChange={e => setDate(e.target.value)} />
        </div>

        {/* People */}
        <div className="form-group">
          <label className="form-label">Who worked out?</label>
          <div className="people-chips">
            {people.length > 1 && (
              <button
                type="button"
                className={`chip chip-all ${selectedPeople.length === people.length ? 'active' : ''}`}
                onClick={() => {
                  if (selectedPeople.length === people.length) {
                    setSelectedPeople([]);
                  } else {
                    setSelectedPeople(people.map(p => p.name));
                  }
                }}
              >
                {selectedPeople.length === people.length ? 'Deselect All' : 'All'}
              </button>
            )}
            {people.map(p => (
              <button
                key={p.id}
                type="button"
                className={`chip ${selectedPeople.includes(p.name) ? 'active' : ''}`}
                onClick={() => togglePerson(p.name)}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Activity */}
        <div className="form-group">
          <label className="form-label">Activity</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g., Gym session, 3 mile run, Yoga..."
            value={activity}
            onChange={e => setActivity(e.target.value)}
          />
        </div>

        {/* Card Selection */}
        <div className="form-group">
          <label className="form-label">Use a card? (optional)</label>
          <div className="card-select-grid">
            <button
              type="button"
              className={`card-option none ${selectedCard === '' ? 'active' : ''}`}
              onClick={() => setSelectedCard('')}
            >
              No card
            </button>
            {availableCards.map(c => (
              <button
                key={c.id}
                type="button"
                className={`card-option ${selectedCard === c.card_name ? 'active' : ''}`}
                onClick={() => setSelectedCard(c.card_name)}
                style={{ borderColor: SUIT_COLORS[c.suit] }}
              >
                <span style={{ color: SUIT_COLORS[c.suit] }}>{SUIT_ICONS[c.suit]}</span> {c.value}
                <span className="card-option-bonus">+{c.bonus_points}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="form-group">
          <label className="form-label">Notes (optional)</label>
          <textarea
            className="form-input form-textarea"
            placeholder="Any details about the workout..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>

        {/* Points Preview */}
        <div className="points-preview">
          <div className="preview-row">
            <span>Base points</span>
            <span>{selectedPeople.length} × 1 = {selectedPeople.length}</span>
          </div>
          {selectedCard && (
            <div className="preview-row bonus">
              <span>Card bonus ({selectedCard})</span>
              <span>+{availableCards.find(c => c.card_name === selectedCard)?.bonus_points || 0}</span>
            </div>
          )}
          <div className="preview-row total">
            <span>Total points</span>
            <span>
              {selectedPeople.length + (selectedCard ? (availableCards.find(c => c.card_name === selectedCard)?.bonus_points || 0) : 0)}
            </span>
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-full"
          disabled={saving || selectedPeople.length === 0 || !activity}
        >
          {saving ? 'Saving...' : '💪 Log Workout'}
        </button>
      </form>
    </div>
  );
}

// ─── Workout History ─────────────────────────────────────────────────────────
function WorkoutHistory({ workouts, onRefresh, onError }) {
  const [deleting, setDeleting] = useState(null);

  async function deleteWorkout(id) {
    const workout = workouts.find(w => w.id === id);
    if (workout?.card_used) {
      const weekStart = getMonday(workout.date);
      await supabase.from('weekly_cards')
        .update({ claimed_by: null, status: 'Available' })
        .eq('week_start_date', weekStart)
        .eq('card_name', workout.card_used);
    }
    const { error } = await supabase.from('workouts').delete().eq('id', id);
    if (error) {
      onError('Failed to delete workout. Please try again.');
      return;
    }
    setDeleting(null);
    await onRefresh();
  }

  const sorted = [...workouts].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);

  // Group workouts by date
  const grouped = [];
  let currentDate = null;
  sorted.forEach(w => {
    if (w.date !== currentDate) {
      currentDate = w.date;
      grouped.push({ date: w.date, workouts: [w] });
    } else {
      grouped[grouped.length - 1].workouts.push(w);
    }
  });

  return (
    <div className="history">
      <h2>Workout History</h2>
      {grouped.length === 0 ? (
        <div className="cards-empty">
          <div className="empty-icon">📋</div>
          <p>No workouts logged yet!</p>
        </div>
      ) : (
        <div className="history-list">
          {grouped.map(group => (
            <div key={group.date} className="history-group">
              <div className="history-group-header">{formatDate(group.date)}</div>
              {group.workouts.map(w => (
                <div key={w.id} className="history-item">
                  <div className="history-content">
                    <div className="history-activity">{w.activity}</div>
                    <div className="history-people">{w.persons}</div>
                    {w.card_used && (
                      <div className="history-card" style={{ color: SUIT_COLORS[w.card_used.split(' of ')[1]] }}>
                        {SUIT_ICONS[w.card_used.split(' of ')[1]]} {w.card_used} (+{w.bonus_points})
                      </div>
                    )}
                    {w.notes && <div className="history-notes">{w.notes}</div>}
                  </div>
                  <div className="history-points">+{w.total_points}</div>
                  <button
                    className="btn-delete"
                    onClick={() => setDeleting(w.id)}
                    title="Delete"
                  >×</button>
                  {deleting === w.id && (
                    <div className="delete-confirm">
                      <span>Delete this entry?</span>
                      <button className="btn btn-small btn-danger" onClick={() => deleteWorkout(w.id)}>Yes</button>
                      <button className="btn btn-small btn-ghost" onClick={() => setDeleting(null)}>No</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── People Manager (Settings) ───────────────────────────────────────────────
function PeopleManager({ people, onRefresh, onError }) {
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);

  async function addPerson(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    const { error } = await supabase.from('people').insert({ name: newName.trim() });
    setAdding(false);
    if (error) { onError('Failed to add player.'); return; }
    setNewName('');
    await onRefresh();
  }

  async function removePerson(id) {
    const { error } = await supabase.from('people').delete().eq('id', id);
    if (error) { onError('Failed to remove player.'); return; }
    await onRefresh();
  }

  return (
    <div className="people-manager">
      <h3>Manage Players</h3>
      <form onSubmit={addPerson} className="add-person-form">
        <input
          className="form-input"
          placeholder="Add player name..."
          value={newName}
          onChange={e => setNewName(e.target.value)}
        />
        <button type="submit" className="btn btn-primary" disabled={adding || !newName.trim()}>
          + Add
        </button>
      </form>
      <div className="people-list">
        {people.map(p => (
          <div key={p.id} className="person-tag">
            <span>{p.name}</span>
            <button className="remove-btn" onClick={() => removePerson(p.id)}>×</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState('dashboard');
  const [workouts, setWorkouts] = useState([]);
  const [people, setPeople] = useState([]);
  const [weeklyCards, setWeeklyCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const showError = useCallback((msg) => {
    setError(msg);
    setTimeout(() => setError(null), 4000);
  }, []);

  const fetchAll = useCallback(async () => {
    const [wRes, pRes, cRes] = await Promise.all([
      supabase.from('workouts').select('*').order('date', { ascending: false }),
      supabase.from('people').select('*').order('name'),
      supabase.from('weekly_cards').select('*').order('id'),
    ]);
    if (wRes.error || pRes.error || cRes.error) {
      showError('Failed to load data. Check your connection and try again.');
    }
    if (wRes.data) setWorkouts(wRes.data);
    if (pRes.data) setPeople(pRes.data);
    if (cRes.data) setWeeklyCards(cRes.data);
    setLoading(false);
  }, [showError]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading Deck Game...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <h1 className="app-title">
            <span className="title-icon">🃏</span> Deck Game
          </h1>
        </div>
        <div className="header-actions">
          <button className="header-btn" onClick={handleRefresh} disabled={refreshing} title="Refresh data">
            <span className={`refresh-icon ${refreshing ? 'spinning' : ''}`}>↻</span>
          </button>
          <button className="header-btn" onClick={() => setShowSettings(!showSettings)}>
            ⚙️
          </button>
        </div>
      </header>

      {error && (
        <div className="error-toast">
          <span>{error}</span>
          <button className="error-dismiss" onClick={() => setError(null)}>×</button>
        </div>
      )}

      {showSettings && (
        <div className="settings-panel">
          <PeopleManager people={people} onRefresh={fetchAll} onError={showError} />
        </div>
      )}

      <main className="app-main">
        {tab === 'dashboard' && (
          <Dashboard workouts={workouts} people={people} weeklyCards={weeklyCards} />
        )}
        {tab === 'cards' && (
          <WeeklyCardsManager weeklyCards={weeklyCards} people={people} onRefresh={fetchAll} onError={showError} />
        )}
        {tab === 'log' && (
          <LogWorkout people={people} weeklyCards={weeklyCards} onRefresh={fetchAll} onError={showError} />
        )}
        {tab === 'history' && (
          <WorkoutHistory workouts={workouts} onRefresh={fetchAll} onError={showError} />
        )}
      </main>

      <TabNav active={tab} onChange={setTab} />
    </div>
  );
}