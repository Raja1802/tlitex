import type { RefObject } from 'react';
import type { FC } from '../../../lib/teact/teact';
import React, {
  memo, useEffect, useRef,
} from '../../../lib/teact/teact';
import { getActions, withGlobal } from '../../../global';

import type { ApiChat, ApiSponsoredMessage, ApiUser } from '../../../api/types';

import { getChatTitle, getUserFullName } from '../../../global/helpers';
import { selectChat, selectSponsoredMessage, selectUser } from '../../../global/selectors';
import { IS_ANDROID, IS_TOUCH_ENV } from '../../../util/windowEnvironment';
import renderText from '../../common/helpers/renderText';
import { renderTextWithEntities } from '../../common/helpers/renderTextWithEntities';
import { preventMessageInputBlur } from '../helpers/preventMessageInputBlur';

import useContextMenuHandlers from '../../../hooks/useContextMenuHandlers';
import useFlag from '../../../hooks/useFlag';
import { useIntersectionObserver } from '../../../hooks/useIntersectionObserver';
import useLang from '../../../hooks/useLang';
import useLastCallback from '../../../hooks/useLastCallback';

import AboutAdsModal from '../../common/AboutAdsModal.async';
import Button from '../../ui/Button';
import SponsoredMessageContextMenuContainer from './SponsoredMessageContextMenuContainer.async';

import './SponsoredMessage.scss';

type OwnProps = {
  chatId: string;
  containerRef: RefObject<HTMLDivElement>;
};

type StateProps = {
  message?: ApiSponsoredMessage;
  bot?: ApiUser;
  channel?: ApiChat;
};

const INTERSECTION_DEBOUNCE_MS = 200;

const SponsoredMessage: FC<OwnProps & StateProps> = ({
  chatId,
  message,
  containerRef,
  bot,
  channel,
}) => {
  const {
    viewSponsoredMessage,
    openChat,
    openChatByInvite,
    startBot,
    focusMessage,
  } = getActions();
  const lang = useLang();
  // eslint-disable-next-line no-null/no-null
  const ref = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line no-null/no-null
  const contentRef = useRef<HTMLDivElement>(null);
  const shouldObserve = Boolean(message);
  const {
    observe: observeIntersection,
  } = useIntersectionObserver({
    rootRef: containerRef,
    debounceMs: INTERSECTION_DEBOUNCE_MS,
    threshold: 1,
  });
  const {
    isContextMenuOpen, contextMenuPosition,
    handleBeforeContextMenu, handleContextMenu,
    handleContextMenuClose, handleContextMenuHide,
  } = useContextMenuHandlers(ref, IS_TOUCH_ENV, true, IS_ANDROID);
  const [isAboutAdsModalOpen, openAboutAdsModal, closeAboutAdsModal] = useFlag(false);

  useEffect(() => {
    return shouldObserve ? observeIntersection(contentRef.current!, (target) => {
      if (target.isIntersecting) {
        viewSponsoredMessage({ chatId });
      }
    }) : undefined;
  }, [chatId, shouldObserve, observeIntersection, viewSponsoredMessage]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    preventMessageInputBlur(e);
    handleBeforeContextMenu(e);
  };

  const handleClick = useLastCallback(() => {
    if (!message) return;
    if (message.chatInviteHash) {
      openChatByInvite({ hash: message.chatInviteHash });
    } else if (message.channelPostId) {
      focusMessage({ chatId: message.chatId!, messageId: message.channelPostId });
    } else {
      openChat({ id: message.chatId });

      if (message.startParam) {
        startBot({
          botId: message.chatId!,
          param: message.startParam,
        });
      }
    }
  });

  if (!message) {
    return undefined;
  }

  return (
    <div
      ref={ref}
      key="sponsored-message"
      className="SponsoredMessage Message open"
      onMouseDown={handleMouseDown}
      onContextMenu={handleContextMenu}
    >
      <div className="message-content has-shadow has-solid-background" dir="auto">
        <div className="content-inner" dir="auto">
          <div className="message-title" dir="ltr">
            {bot && renderText(getUserFullName(bot) || '')}
            {channel && renderText(message.chatInviteTitle || getChatTitle(lang, channel) || '')}
          </div>

          <div className="text-content with-meta" dir="auto" ref={contentRef}>
            <span className="text-content-inner" dir="auto">
              {renderTextWithEntities({
                text: message.text.text,
                entities: message.text.entities,
              })}
            </span>

            <span className="MessageMeta" dir="ltr">
              <span className="message-signature">
                {message.isRecommended ? lang('Message.RecommendedLabel') : lang('SponsoredMessage')}
              </span>
            </span>
          </div>

          <Button color="secondary" size="tiny" ripple onClick={handleClick} className="SponsoredMessage__button">
            {lang(message.isBot
              ? 'Conversation.ViewBot'
              : (message.channelPostId ? 'Conversation.ViewPost' : 'Conversation.ViewChannel'))}
          </Button>
        </div>
      </div>
      {contextMenuPosition && (
        <SponsoredMessageContextMenuContainer
          isOpen={isContextMenuOpen}
          anchor={contextMenuPosition}
          message={message!}
          onAboutAds={openAboutAdsModal}
          onClose={handleContextMenuClose}
          onCloseAnimationEnd={handleContextMenuHide}
        />
      )}
      <AboutAdsModal
        isOpen={isAboutAdsModalOpen}
        onClose={closeAboutAdsModal}
      />
    </div>
  );
};

export default memo(withGlobal<OwnProps>(
  (global, { chatId }): StateProps => {
    const message = selectSponsoredMessage(global, chatId);
    const { chatId: fromChatId, isBot } = message || {};

    return {
      message,
      bot: fromChatId && isBot ? selectUser(global, fromChatId) : undefined,
      channel: !isBot && fromChatId ? selectChat(global, fromChatId) : undefined,
    };
  },
)(SponsoredMessage));
