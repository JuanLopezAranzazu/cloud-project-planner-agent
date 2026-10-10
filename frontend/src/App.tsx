import { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Container, Heading, Text } from '@chakra-ui/react';
import { Header } from './components/Header';
import { IdeaForm } from './components/IdeaForm';
import { Thinking } from './components/Thinking';
import { ErrorNotice } from './components/ErrorNotice';
import { PlanView } from './components/PlanView';
import { createPlan } from './api';
import type { Plan, PlanRequest } from './types';

type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done'; plan: Plan }
  | { status: 'error'; error: Error };

export default function App() {
  const [state, setState] = useState<State>({ status: 'idle' });
  const [lastReq, setLastReq] = useState<PlanRequest | undefined>();
  const abortRef = useRef<AbortController | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const run = useCallback(async (req: PlanRequest) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLastReq(req);
    setState({ status: 'loading' });
    try {
      const plan = await createPlan(req, controller.signal);
      setState({ status: 'done', plan });
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return;
      setState({ status: 'error', error: e instanceof Error ? e : new Error('Unknown error') });
    }
  }, []);

  const cancel = () => {
    abortRef.current?.abort();
    setState({ status: 'idle' });
  };

  // When the plan arrives, move focus to the title (screen-reader friendly).
  useEffect(() => {
    if (state.status === 'done') {
      headingRef.current?.focus();
      headingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [state.status]);

  const showForm = state.status === 'idle' || state.status === 'error';

  return (
    <Container maxW="4xl" px={{ base: 4, md: 6 }} pb={{ base: 'calc(3rem + env(safe-area-inset-bottom, 0px))', md: 20 }}>
      <Header />

      {state.status === 'idle' && (
        <Box py={{ base: 4, md: 10 }}>
          <Heading as="h1" fontSize={{ base: '3xl', sm: '4xl', md: '6xl' }} maxW={{ base: 'none', md: '14ch' }}>
            Tell me your idea. I'll hand you the blueprint.
          </Heading>
          <Text mt={{ base: 4, md: 5 }} fontSize={{ base: 'md', md: 'lg' }} maxW="56ch" color="muted">
            Hi, I'm Nimbo. I turn a software idea into a technical plan on AWS: services,
            roadmap, costs and risks, tailored to your level and your budget.
          </Text>
        </Box>
      )}

      <Box mt={state.status === 'idle' ? 0 : 4} aria-live="polite">
        {state.status === 'error' && (
          <Box mb={5}>
            <ErrorNotice
              error={state.error}
              onRetry={() => lastReq && run(lastReq)}
              onEdit={() => document.getElementById('idea')?.focus()}
            />
          </Box>
        )}

        {showForm && <IdeaForm key={lastReq ? 'again' : 'first'} onSubmit={run} initial={lastReq} />}
        {state.status === 'loading' && <Thinking onCancel={cancel} />}
        {state.status === 'done' && (
          <PlanView ref={headingRef} plan={state.plan} onReset={() => setState({ status: 'idle' })} />
        )}
      </Box>
    </Container>
  );
}
